import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use same pattern as /api/clients which works
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  console.log('=== START GET /api/interventions ===');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ultra-simple query WITHOUT table joins to isolate the issue
    console.log('Querying interventions (basic fields only)...');
    const { data, error } = await supabase
      .from('interventions')
      .select('id, created_at, status, notes, intervention_type_id, client_id, vehicle_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} interventions`);

    // Return raw data without mapping for now
    const interventions = (data || []).map(intervention => ({
      id: intervention.id,
      type: `Type ${intervention.intervention_type_id}`,  // Placeholder
      client: `Client ${intervention.client_id}`,  // Placeholder
      vehicule: intervention.vehicle_id ? `Vehicle ${intervention.vehicle_id}` : 'N/A',
      status: intervention.status,
      creeLe: intervention.created_at,
    }));

    console.log('=== GET SUCCESS ===');
    return NextResponse.json(interventions);

  } catch (error) {
    console.error('=== ERROR in GET ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 3).join('\n')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await request.formData();

    // Récupérer le type d'intervention en texte
    const interventionTypeName = formData.get('type') as string;

    console.log('🔍 Looking up intervention type:', interventionTypeName);

    // Chercher l'intervention_type_id correspondant
    const { data: interventionTypes, error: typeError } = await supabase
      .from('intervention_types')
      .select('id')
      .eq('name', interventionTypeName)
      .single();

    if (typeError || !interventionTypes) {
      console.error('❌ Intervention type not found:', interventionTypeName, typeError);
      return NextResponse.json({
        error: `Type d'intervention "${interventionTypeName}" introuvable`
      }, { status: 400 });
    }

    console.log('✅ Found intervention type ID:', interventionTypes.id);

    // Get authenticated agent from token
    const token = request.cookies.get('sb-access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    let agentId: string | null = null;

    if (token) {
      const supabaseAuth = createClient(supabaseUrl, supabaseKey);
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

      if (!authError && user) {
        agentId = user.id;
        console.log('✅ Using authenticated agent ID:', agentId);
      }
    }

    if (!agentId) {
      console.error('❌ No authenticated agent');
      return NextResponse.json({
        error: 'Agent non authentifié'
      }, { status: 401 });
    }

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

    console.log('📦 Metadata captured:', metadata);

    // Gérer le client_id : utiliser un client interne pour "Remplissage Cuve"
    let clientId = getFormValue('clientId');

    // Si pas de clientId ET que c'est un "Remplissage Cuve", créer/utiliser client interne
    if (!clientId && interventionTypeName === 'Remplissage Cuve') {
      console.log('🏢 Remplissage Cuve détecté - recherche du client interne...');

      // Chercher ou créer le client "FleetZen - Opérations Internes"
      const { data: internalClient, error: clientSearchError } = await supabase
        .from('clients')
        .select('id')
        .eq('code', 'FLEETZEN-INTERNAL')
        .single();

      if (internalClient) {
        console.log('✅ Client interne trouvé:', internalClient.id);
        clientId = internalClient.id;
      } else {
        console.log('📝 Création du client interne...');
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert([{
            name: 'FleetZen - Opérations Internes',
            code: 'FLEETZEN-INTERNAL',
            metadata: { internal: true, description: 'Client virtuel pour opérations internes' }
          }])
          .select()
          .single();

        if (createError) {
          console.error('❌ Erreur création client interne:', createError);
          throw new Error('Impossible de créer le client interne');
        }

        console.log('✅ Client interne créé:', newClient.id);
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

    console.log('🔍 Attempting to insert:', interventionData);

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from('interventions')
      .insert([interventionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('📋 Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Insert successful:', data);

    // Upload des photos si présentes
    console.log('📸 Checking for photos in FormData...');

    // Debug: Lister tous les champs du FormData
    const allKeys: string[] = [];
    for (const key of formData.keys()) {
      allKeys.push(key);
    }
    console.log('📋 All FormData keys:', allKeys);
    console.log('🔍 Photo keys found:', allKeys.filter(k => k.toLowerCase().includes('photo')));

    const photosAvantFiles = formData.getAll('photosAvant') as File[];
    const photosApresFiles = formData.getAll('photosApres') as File[];
    const photoManometreFiles = formData.getAll('photoManometre') as File[];

    // Photos spécifiques à "Remplissage Cuve"
    const photosJaugesAvantFiles = formData.getAll('photosJaugesAvant') as File[];
    const photosJaugesApresFiles = formData.getAll('photosJaugesApres') as File[];
    const photoTicketFiles = formData.getAll('photoTicket') as File[];

    console.log(`📸 Photos Avant: ${photosAvantFiles.length} fichiers`);
    console.log(`📸 Photos Après: ${photosApresFiles.length} fichiers`);
    console.log(`📸 Photos Manomètre: ${photoManometreFiles.length} fichiers`);
    console.log(`📸 Photos Jauges Avant: ${photosJaugesAvantFiles.length} fichiers`);
    console.log(`📸 Photos Jauges Après: ${photosJaugesApresFiles.length} fichiers`);
    console.log(`📸 Photo Ticket: ${photoTicketFiles.length} fichiers`);

    const photosAvantUrls: string[] = [];
    const photosApresUrls: string[] = [];
    const photoManometreUrls: string[] = [];
    const photosJaugesAvantUrls: string[] = [];
    const photosJaugesApresUrls: string[] = [];
    const photoTicketUrls: string[] = [];

    // Upload des photos AVANT
    for (let i = 0; i < photosAvantFiles.length; i++) {
      const photoFile = photosAvantFiles[i];

      console.log(`📸 Processing photo AVANT ${i + 1}/${photosAvantFiles.length}:`, {
        name: photoFile?.name,
        size: photoFile?.size,
        type: photoFile?.type
      });

      if (photoFile && photoFile.size > 0) {
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${data.id}/avant-${Date.now()}-${i}.${fileExtension}`;

        console.log(`⬆️ Uploading AVANT to: ${fileName}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intervention-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type || 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error(`❌ Error uploading photo AVANT ${i}:`, uploadError);
          console.error(`❌ Upload error details:`, JSON.stringify(uploadError, null, 2));
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName);

          photosAvantUrls.push(publicUrl);
          console.log(`✅ Photo AVANT ${i + 1} uploaded:`, publicUrl);
        }
      }
    }

    // Upload des photos APRÈS
    for (let i = 0; i < photosApresFiles.length; i++) {
      const photoFile = photosApresFiles[i];

      console.log(`📸 Processing photo APRÈS ${i + 1}/${photosApresFiles.length}:`, {
        name: photoFile?.name,
        size: photoFile?.size,
        type: photoFile?.type
      });

      if (photoFile && photoFile.size > 0) {
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${data.id}/apres-${Date.now()}-${i}.${fileExtension}`;

        console.log(`⬆️ Uploading APRÈS to: ${fileName}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intervention-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type || 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error(`❌ Error uploading photo APRÈS ${i}:`, uploadError);
          console.error(`❌ Upload error details:`, JSON.stringify(uploadError, null, 2));
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName);

          photosApresUrls.push(publicUrl);
          console.log(`✅ Photo APRÈS ${i + 1} uploaded:`, publicUrl);
        }
      }
    }

    // Upload des photos MANOMETRE (pour livraison carburant)
    for (let i = 0; i < photoManometreFiles.length; i++) {
      const photoFile = photoManometreFiles[i];

      console.log(`📸 Processing photo MANOMETRE ${i + 1}/${photoManometreFiles.length}:`, {
        name: photoFile?.name,
        size: photoFile?.size,
        type: photoFile?.type
      });

      if (photoFile && photoFile.size > 0) {
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${data.id}/manometre-${Date.now()}-${i}.${fileExtension}`;

        console.log(`⬆️ Uploading MANOMETRE to: ${fileName}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intervention-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type || 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error(`❌ Error uploading photo MANOMETRE ${i}:`, uploadError);
          console.error(`❌ Upload error details:`, JSON.stringify(uploadError, null, 2));
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName);

          photoManometreUrls.push(publicUrl);
          console.log(`✅ Photo MANOMETRE ${i + 1} uploaded:`, publicUrl);
        }
      }
    }

    // Upload des photos JAUGES AVANT (pour remplissage cuve)
    for (let i = 0; i < photosJaugesAvantFiles.length; i++) {
      const photoFile = photosJaugesAvantFiles[i];
      if (photoFile && photoFile.size > 0) {
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${data.id}/jauges-avant-${Date.now()}-${i}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intervention-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type || 'image/jpeg',
            cacheControl: '3600',
          });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName);
          photosJaugesAvantUrls.push(publicUrl);
          console.log(`✅ Photo JAUGES AVANT ${i + 1} uploaded:`, publicUrl);
        }
      }
    }

    // Upload des photos JAUGES APRÈS (pour remplissage cuve)
    for (let i = 0; i < photosJaugesApresFiles.length; i++) {
      const photoFile = photosJaugesApresFiles[i];
      if (photoFile && photoFile.size > 0) {
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${data.id}/jauges-apres-${Date.now()}-${i}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intervention-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type || 'image/jpeg',
            cacheControl: '3600',
          });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName);
          photosJaugesApresUrls.push(publicUrl);
          console.log(`✅ Photo JAUGES APRÈS ${i + 1} uploaded:`, publicUrl);
        }
      }
    }

    // Upload des photos TICKET (pour remplissage cuve)
    for (let i = 0; i < photoTicketFiles.length; i++) {
      const photoFile = photoTicketFiles[i];
      if (photoFile && photoFile.size > 0) {
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${data.id}/ticket-${Date.now()}-${i}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intervention-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type || 'image/jpeg',
            cacheControl: '3600',
          });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName);
          photoTicketUrls.push(publicUrl);
          console.log(`✅ Photo TICKET ${i + 1} uploaded:`, publicUrl);
        }
      }
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

      await supabase
        .from('interventions')
        .update({
          metadata: {
            ...metadata,
            photos: photoMetadata
          }
        })
        .eq('id', data.id);

      console.log(`✅ ${photosAvantUrls.length} AVANT + ${photosApresUrls.length} APRÈS + ${photoManometreUrls.length} MANOMETRE + ${photosJaugesAvantUrls.length} JAUGES AVANT + ${photosJaugesApresUrls.length} JAUGES APRÈS + ${photoTicketUrls.length} TICKET saved`);
    }

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
    console.error('❌ Error creating intervention:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines only
    } : { raw: String(error) };

    return NextResponse.json({
      error: 'Erreur lors de la création de l\'intervention',
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
