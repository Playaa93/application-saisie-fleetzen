import { NextRequest, NextResponse } from 'next/server';

// MVP: données en mémoire
let interventions: any[] = [];
let nextId = 1;

export async function GET() {
  return NextResponse.json(interventions);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const intervention = {
      id: nextId++,
      type: formData.get('type'),
      client: formData.get('client'),
      vehicule: formData.get('vehicule'),
      kilometres: formData.get('kilometres') ? parseInt(formData.get('kilometres') as string) : null,
      notes: formData.get('notes'),
      creeLe: new Date().toISOString(),
      photos: []
    };
    
    const photoFiles = [];
    for (let i = 0; i < 2; i++) {
      const photo = formData.get(`photo${i}`);
      if (photo instanceof File) {
        photoFiles.push({
          id: Date.now() + i,
          url: `/uploads/photo-${Date.now()}-${i}.jpg`,
          type: i === 0 ? 'avant' : 'apres'
        });
      }
    }
    intervention.photos = photoFiles;
    interventions.push(intervention);
    return NextResponse.json({ success: true, intervention });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
