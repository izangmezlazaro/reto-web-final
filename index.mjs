import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { randomUUID } from 'node:crypto';

// Clientes AWS SDK v3
const ddb = new DynamoDBClient({ region: 'us-east-1' });
const sns = new SNSClient({ region: 'us-east-1' });

const TABLE_NAME = 'ContactMessages';
const TOPIC_ARN = 'arn:aws:sns:us-east-1:012301900181:RetoRequest';

export const handler = async (event) => {
  console.log('Evento recibido:', JSON.stringify(event));

  try {
    let body = {};
    if (event.body) {
      if (typeof event.body === 'string') {
        try {
          body = JSON.parse(event.body);
        } catch (e) {
          console.warn('Error al parsear event.body como JSON:', e);
          body = {};
        }
      } else {
        body = event.body;
      }
    }

    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const interest = (body.interest ?? '').trim();

    // 1. Validación de campos obligatorios
    if (!name || !email || !interest) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          success: false,
          error: 'Nombre, email y estilo de experiencia misteriosa son obligatorios'
        })
      };
    }

    const id = randomUUID();
    const timestamp = new Date().toISOString();

    // 2. Guardar solicitud de Viaje Secreto en DynamoDB
    const putItemCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        id: { S: id },
        name: { S: name },
        email: { S: email },
        interest: { S: interest },
        category: { S: 'Viaje a Destino Misterioso (WanderMistery)' },
        timestamp: { S: timestamp }
      }
    });
    await ddb.send(putItemCommand);
    console.log(`✅ Solicitud de viaje guardada en DynamoDB con ID: ${id}`);

    // 3. Notificación SNS adaptada a Viajes a Destinos Misteriosos
    const publishCommand = new PublishCommand({
      TopicArn: TOPIC_ARN,
      // Asunto del correo:
      Subject: `Nueva Solicitud de Viaje Secreto - ${name}`,
      // Mensaje del correo:
      Message: JSON.stringify({
        id: id,
        name: name,
        email: email,
        experiencia: interest,
        servicio: 'WanderMistery · Viajes a Destinos Secretos',
        timestamp: timestamp
      }, null, 2)
    });
    await sns.send(publishCommand);
    console.log('📬 Notificación SNS enviada con éxito');

    // 4. Respuesta de éxito al frontend
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: true,
        message: `¡Aventura solicitada con éxito para ${name} (${interest})! Revisa tu email para las pistas preliminares.`,
        id: id
      })
    };

  } catch (error) {
    console.error('❌ Error en Lambda:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: false,
        error: 'Error interno al procesar la solicitud de viaje',
        details: error.message
      })
    };
  }
};

// Cabeceras CORS obligatorias para peticiones desde el navegador
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
}
