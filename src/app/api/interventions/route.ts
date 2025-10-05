import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import logger, { logError } from '@/lib/logger';
import { interventionQuerySchema } from '@/lib/validations/api';
import { ZodError } from 'zod';

// Service role client for admin operations (storage upload)
import { createClient as createServiceClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate query parameters with Zod
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = interventionQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'GET /api/interventions - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Paramètres de requête invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    // Legacy support for 'my' parameter (not in schema)
    const agentId = searchParams.get('agent_id');
    const myInterventions = searchParams.get('my') === 'true';

    // Create Supabase SSR client (auto-handles cookies)
    const supabase = await createClient();

    // Get authenticated user if filtering by "my interventions"
    let currentUserId: string | null = null;
    if (myInterventions) {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    }

    // Build query with optional agent filter
    let query = supabase
      .from('interventions')
      .select(`
        *,
        intervention_types (name),
        clients (name),
        vehicles (license_plate, make, model),
        agents (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    // Apply agent filter if specified
    if (agentId) {
      query = query.eq('agent_id', agentId);
    } else if (myInterventions && currentUserId) {
      query = query.eq('agent_id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      logError(error, { context: 'GET /api/interventions', agentId, myInterventions });
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info({
      count: data.length,
      filtered: { agentId, myInterventions },
      duration
    }, 'Interventions fetched');

    // Mapper les champs pour compatibilité frontend
    const interventions = data.map(intervention => ({
      id: intervention.id,
      type: intervention.intervention_types?.name || '',
      client: intervention.clients?.name || '',
      vehicule: intervention.vehicles?.license_plate ?
        `${intervention.vehicles.license_plate} - ${intervention.vehicles.make} ${intervention.vehicles.model}` : '',
      agent: intervention.agents ?
        `${intervention.agents.first_name} ${intervention.agents.last_name}` : 'Non assigné',
      agentId: intervention.agent_id,
      kilometres: null, // Pas de champ kilomètres dans la table
      notes: intervention.notes,
      status: intervention.status,
      creeLe: intervention.created_at,
      photos: [] // Pas encore implémenté
    }));

    return NextResponse.json({ interventions });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'GET /api/interventions - general error', duration });
    return NextResponse.json({ error: 'Erreur de récupération' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Create Supabase SSR client for auth
    const supabase = await createClient();
    const formData = await request.formData();

    // Récupérer le type d'intervention en texte
    const interventionTypeName = formData.get('type') as string;

    logger.debug({ interventionTypeName }, 'Looking up intervention type');

    // Chercher l'intervention_type_id correspondant
    const { data: interventionTypes, error: typeError } = await supabase
      .from('intervention_types')
      .select('id')
      .eq('name', interventionTypeName)
      .single();

    if (typeError || !interventionTypes) {
      logError(typeError, { context: 'Intervention type lookup', interventionTypeName });
      return NextResponse.json({
        error: `Type d'intervention "${interventionTypeName}" introuvable`
      }, { status: 400 });
    }

    logger.debug({ interventionTypeId: interventionTypes.id }, 'Intervention type found');

    // Get authenticated agent from SSR session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logError(authError, { context: 'Agent authentication' });
      return NextResponse.json({
        error: 'Agent non authentifié'
      }, { status: 401 });
    }

    const agentId = user.id;
    logger.debug({ agentId }, 'Agent authenticated'); // agentId sera automatiquement redacted si dans le path

    // Helper pour convertir "null" string en null réel
    const getFormValue = (key: string): string | null => {
      const value = formData.get(key) as string;
      return (value === 'null' || value === 'undefined' || !value) ? null : value;
    };

    // Extraire TOUTES les données du formulaire pour les métadonnées
    const metadata: Record<string, any> = {};
    const excludedKeys = ['type', 'clientId', 'vehicleId', 'notes', 'client', 'vehicule'];

    for (const [key, value] of formData.entries()) {
      // Ignorer les champs photo et les champs déjà mappés
      if (!key.startsWith('photo') && !excludedKeys.includes(key)) {
        metadata[key] = value;
      }
    }

    logger.debug({ metadataKeys: Object.keys(metadata) }, 'Metadata captured');

    // Gérer le client_id : utiliser un client interne pour "Remplissage Cuve"
    let clientId = getFormValue('clientId');

    // Si pas de clientId ET que c'est un "Remplissage Cuve", créer/utiliser client interne
    if (!clientId && interventionTypeName === 'Remplissage Cuve') {
      logger.info({ interventionTypeName }, 'Remplissage Cuve detected - looking up internal client');

      // Use service role for internal operations
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

      // Chercher ou créer le client "FleetZen - Opérations Internes"
      const { data: internalClient, error: clientSearchError } = await serviceClient
        .from('clients')
        .select('id')
        .eq('code', 'FLEETZEN-INTERNAL')
        .single();

      if (internalClient) {
        logger.debug({ clientId: internalClient.id }, 'Internal client found');
        clientId = internalClient.id;
      } else {
        logger.info('Creating internal client');
        const { data: newClient, error: createError } = await serviceClient
          .from('clients')
          .insert([{
            name: 'FleetZen - Opérations Internes',
            code: 'FLEETZEN-INTERNAL',
            metadata: { internal: true, description: 'Client virtuel pour opérations internes' }
          }])
          .select()
          .single();

        if (createError) {
          logError(createError, { context: 'Create internal client' });
          throw new Error('Impossible de créer le client interne');
        }

        logger.info({ clientId: newClient.id }, 'Internal client created');
        clientId = newClient.id;
      }
    }

    if (!clientId) {
      return NextResponse.json({
        error: 'client_id requis pour cette intervention'
      }, { status: 400 });
    }

    // Préparer les données d'intervention
    // Get GPS data from formData
    const latitude = getFormValue('latitude');
    const longitude = getFormValue('longitude');
    const gpsAccuracy = getFormValue('gpsAccuracy');
    const gpsCapturedAt = getFormValue('gpsCapturedAt');

    const interventionData = {
      intervention_type_id: interventionTypes.id,
      agent_id: agentId,
      client_id: clientId,  // Required field
      vehicle_id: getFormValue('vehicleId'),  // Optional field
      status: 'completed' as const,
      notes: getFormValue('notes'),
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      completed_at: new Date().toISOString(),
      // GPS coordinates
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      gps_accuracy: gpsAccuracy ? parseFloat(gpsAccuracy) : null,
      gps_captured_at: gpsCapturedAt || null,
    };

    logger.debug({ interventionType: interventionTypeName, hasGPS: !!latitude }, 'Attempting intervention insert');

    // Use service role client for INSERT (bypasses RLS)
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Insérer dans Supabase
    const { data, error } = await serviceClient
      .from('interventions')
      .insert([interventionData])
      .select()
      .single();

    if (error) {
      logError(error, { context: 'Supabase intervention insert' });
      throw error;
    }

    logger.info({ interventionId: data.id }, 'Intervention insert successful');

    // Upload des photos si présentes
    const photosAvantFiles = formData.getAll('photosAvant') as File[];
    const photosApresFiles = formData.getAll('photosApres') as File[];
    const photoManometreFiles = formData.getAll('photoManometre') as File[];

    // Photos spécifiques à "Remplissage Cuve"
    const photosJaugesAvantFiles = formData.getAll('photosJaugesAvant') as File[];
    const photosJaugesApresFiles = formData.getAll('photosJaugesApres') as File[];
    const photoTicketFiles = formData.getAll('photoTicket') as File[];

    logger.debug({
      photoCounts: {
        avant: photosAvantFiles.length,
        apres: photosApresFiles.length,
        manometre: photoManometreFiles.length,
        jaugesAvant: photosJaugesAvantFiles.length,
        jaugesApres: photosJaugesApresFiles.length,
        ticket: photoTicketFiles.length,
      }
    }, 'Photo files received');

    const photosAvantUrls: string[] = [];
    const photosApresUrls: string[] = [];
    const photoManometreUrls: string[] = [];
    const photosJaugesAvantUrls: string[] = [];
    const photosJaugesApresUrls: string[] = [];
    const photoTicketUrls: string[] = [];

    // Create service role client for storage uploads (bypasses RLS)
    const storageClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Helper function for photo upload
    const uploadPhoto = async (photoFile: File, type: string, index: number): Promise<string | null> => {
      if (!photoFile || photoFile.size === 0) return null;

      const fileExtension = photoFile.name.split('.').pop() || 'jpg';
      const fileName = `${data.id}/${type}-${Date.now()}-${index}.${fileExtension}`;

      const { error: uploadError } = await storageClient.storage
        .from('intervention-photos')
        .upload(fileName, photoFile, {
          contentType: photoFile.type || 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) {
        logError(uploadError, { context: 'Photo upload', type, index, fileName });
        return null;
      }

      const { data: { publicUrl } } = storageClient.storage
        .from('intervention-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    };

    // Upload des photos AVANT
    for (let i = 0; i < photosAvantFiles.length; i++) {
      const url = await uploadPhoto(photosAvantFiles[i], 'avant', i);
      if (url) photosAvantUrls.push(url);
    }

    // Upload des photos APRÈS
    for (let i = 0; i < photosApresFiles.length; i++) {
      const url = await uploadPhoto(photosApresFiles[i], 'apres', i);
      if (url) photosApresUrls.push(url);
    }

    // Upload des photos MANOMETRE (pour livraison carburant)
    for (let i = 0; i < photoManometreFiles.length; i++) {
      const url = await uploadPhoto(photoManometreFiles[i], 'manometre', i);
      if (url) photoManometreUrls.push(url);
    }

    // Upload des photos JAUGES AVANT (pour remplissage cuve)
    for (let i = 0; i < photosJaugesAvantFiles.length; i++) {
      const url = await uploadPhoto(photosJaugesAvantFiles[i], 'jauges-avant', i);
      if (url) photosJaugesAvantUrls.push(url);
    }

    // Upload des photos JAUGES APRÈS (pour remplissage cuve)
    for (let i = 0; i < photosJaugesApresFiles.length; i++) {
      const url = await uploadPhoto(photosJaugesApresFiles[i], 'jauges-apres', i);
      if (url) photosJaugesApresUrls.push(url);
    }

    // Upload des photos TICKET (pour remplissage cuve)
    for (let i = 0; i < photoTicketFiles.length; i++) {
      const url = await uploadPhoto(photoTicketFiles[i], 'ticket', i);
      if (url) photoTicketUrls.push(url);
    }

    // Mettre à jour l'intervention avec les URLs des photos séparées
    if (photosAvantUrls.length > 0 || photosApresUrls.length > 0 || photoManometreUrls.length > 0 ||
        photosJaugesAvantUrls.length > 0 || photosJaugesApresUrls.length > 0 || photoTicketUrls.length > 0) {
      const photoMetadata = {
        photosAvant: photosAvantUrls.map((url, idx) => ({
          url,
          uploadedAt: new Date().toISOString(),
          index: idx
        })),
        photosApres: photosApresUrls.map((url, idx) => ({
          url,
          uploadedAt: new Date().toISOString(),
          index: idx
        })),
        photoManometre: photoManometreUrls.map((url, idx) => ({
          url,
          uploadedAt: new Date().toISOString(),
          index: idx
        })),
        photosJaugesAvant: photosJaugesAvantUrls.map((url, idx) => ({
          url,
          uploadedAt: new Date().toISOString(),
          index: idx
        })),
        photosJaugesApres: photosJaugesApresUrls.map((url, idx) => ({
          url,
          uploadedAt: new Date().toISOString(),
          index: idx
        })),
        photoTicket: photoTicketUrls.map((url, idx) => ({
          url,
          uploadedAt: new Date().toISOString(),
          index: idx
        }))
      };

      // Use service client for UPDATE (already created above)
      const updateClient = createServiceClient(supabaseUrl, supabaseServiceKey);

      await updateClient
        .from('interventions')
        .update({
          metadata: {
            ...metadata,
            photos: photoMetadata
          }
        })
        .eq('id', data.id);

      const totalPhotos = photosAvantUrls.length + photosApresUrls.length + photoManometreUrls.length +
        photosJaugesAvantUrls.length + photosJaugesApresUrls.length + photoTicketUrls.length;

      logger.info({
        interventionId: data.id,
        photosSaved: {
          avant: photosAvantUrls.length,
          apres: photosApresUrls.length,
          manometre: photoManometreUrls.length,
          jaugesAvant: photosJaugesAvantUrls.length,
          jaugesApres: photosJaugesApresUrls.length,
          ticket: photoTicketUrls.length,
          total: totalPhotos
        }
      }, 'Photos uploaded and metadata updated');
    }

    const duration = Date.now() - startTime;
    const totalPhotos = photosAvantUrls.length + photosApresUrls.length + photoManometreUrls.length +
      photosJaugesAvantUrls.length + photosJaugesApresUrls.length + photoTicketUrls.length;

    logger.info({
      interventionId: data.id,
      totalPhotos,
      duration
    }, 'Intervention created successfully');

    return NextResponse.json({
      success: true,
      intervention: data,
      photosAvantUploaded: photosAvantUrls.length,
      photosApresUploaded: photosApresUrls.length,
      photoManometreUploaded: photoManometreUrls.length,
      photosJaugesAvantUploaded: photosJaugesAvantUrls.length,
      photosJaugesApresUploaded: photosJaugesApresUrls.length,
      photoTicketUploaded: photoTicketUrls.length
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'POST /api/interventions - general error', duration });
    return NextResponse.json({
      error: 'Erreur lors de la création de l\'intervention'
    }, { status: 500 });
  }
}
