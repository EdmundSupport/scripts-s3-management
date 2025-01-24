import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
import { createReadStream, writeFileSync } from 'fs';
import * as path from 'path';
dotenv.config();

// Configura las credenciales de AWS y la región
console.log('Conectando a S3');
const s3 = new AWS.S3();
console.log('S3 Conectado.');

// Función para listar buckets
const listFolder = async (bucket: string, prefix: string = '/') => {
    try {
        const params = {
            Bucket: `${bucket}`,
            Prefix: `${prefix}`,
            Delimiter: '/',
        }
        const response = await s3.listObjectsV2(params).promise();
        console.log('Folders:', response.$response.data);
    } catch (error) {
        console.error('Error al listar folders:', error);
    }
};

// Función para listar archivos
const listFiles = async (bucket: string, prefix: string = '/') => {
    try {
        const params = {
            Bucket: `${bucket}`,
            Prefix: `${prefix}`,
        }
        const response = await s3.listObjectsV2(params).promise();
        console.log('Archivos:', response.$response.data);
    } catch (error) {
        console.error('Error al listar archivos:', error);
    }
};

// Función para listar archivos
const download = async (bucket: string, prefix: string) => {
    try {
        const params = {
            Bucket: `${bucket}`,
            Key: `${prefix}`,
        }
        const response = await s3.getObject(params).promise();
        console.log('Archivos:', response.$response.data);
    } catch (error) {
        console.error('Error al listar archivos:', error);
    }
};

// Función para listar buckets
const listBuckets = async () => {
    try {
        const response = await s3.listBuckets().promise();
        console.log('Buckets:', response.$response.data);
    } catch (error) {
        console.error('Error al listar buckets:', error);
    }
};

// Función para crear un bucket
const createBucket = async (bucketName: string) => {
    try {
        const existingBuckets = await s3.listBuckets().promise();
        const bucketExists = existingBuckets.Buckets?.some((bucket) => bucket.Name === bucketName);

        if (bucketExists) {
            console.log(`El bucket "${bucketName}" ya existe.`);
            return;
        }

        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`Bucket "${bucketName}" creado exitosamente.`);
    } catch (error) {
        console.error('Error al crear el bucket:', error);
    }
};

// Función para crear un bucket
const createFolder = async (bucketName: string, prefix: string) => {
    try {
        const base = prefix + '/home.txt';
        try {
            const paramsSearch = {
                Key: base,
                Bucket: bucketName,
            };
            await s3.headObject(paramsSearch).promise();
        } catch (error: any) {
            console.error(`La carpeta "${bucketName}/${prefix}" ya existe.`);
            if (error.code !== 'NotFound') throw error;
        }

        const params = {
            Bucket: bucketName,
            Key: base,
            Body: new Date().toISOString(), // Cambia el contenido según el archivo
            ContentType: 'text/plain', // Cambia el tipo de contenido según el archivo
        };

        await s3.putObject(params).promise();
        console.log(`Carpeta "${bucketName}/${base}" creado exitosamente.`);
    } catch (error) {
        console.error('Error al crear la carpeta:', error);
    }
};

// Función para copiar un archivo sin sobrescribir
const copyFile = async (sourceBucket: string, sourceKey: string, destBucket: string, destKey: string) => {
    try {
        // Verificar si el archivo ya existe en el destino
        try {
            await s3.headObject({ Bucket: destBucket, Key: destKey }).promise();
            console.log(`El archivo "${destKey}" ya existe en el bucket "${destBucket}".`);
            return;
        } catch (error: any) {
            if (error.code !== 'NotFound') throw error;
        }

        await s3.copyObject({
            Bucket: destBucket,
            CopySource: `${sourceBucket}/${sourceKey}`,
            Key: destKey,
        }).promise();

        console.log(`Archivo "${sourceKey}" copiado exitosamente a "${destBucket}/${destKey}".`);
    } catch (error) {
        console.error('Error al copiar el archivo:', error);
    }
};

// Función para copiar una carpeta sin sobrescribir
const copyFolder = async (sourceBucket: string, sourceFolder: string, destBucket: string, destFolder: string) => {
    try {
        const objects = await s3.listObjectsV2({
            Bucket: sourceBucket,
            Prefix: sourceFolder,
        }).promise();

        if (!objects.Contents || objects.Contents.length === 0) {
            console.log(`No se encontraron objetos en la carpeta "${sourceFolder}".`);
            return;
        }

        for (const obj of objects.Contents) {
            if (!obj.Key) continue;

            const relativePath = obj.Key.substring(sourceFolder.length);
            const destKey = `${destFolder}${relativePath}`;

            // Verificar si el archivo ya existe en el destino
            try {
                await s3.headObject({ Bucket: destBucket, Key: destKey }).promise();
                console.log(`El archivo "${destKey}" ya existe en el bucket "${destBucket}".`);
                continue;
            } catch (error: any) {
                if (error.code !== 'NotFound') throw error;
            }

            await s3.copyObject({
                Bucket: destBucket,
                CopySource: `${sourceBucket}/${obj.Key}`,
                Key: destKey,
            }).promise();

            console.log(`Archivo "${obj.Key}" copiado exitosamente a "${destBucket}/${destKey}".`);
        }
    } catch (error) {
        console.error('Error al copiar la carpeta:', error);
    }
};

const getMimeType = (fileName: string) => {
    // Mapa de extensiones comunes a tipos MIME
    const mimeTypes: Record<string, any> = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.ogg': 'audio/ogg',
        '.webm': 'video/webm',
        '.wav': 'audio/wav',
        '.avi': 'video/x-msvideo',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    // Obtiene la extensión del archivo
    const extname = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

    // Devuelve el tipo MIME correspondiente o un tipo genérico por defecto
    return mimeTypes['.' + extname] || mimeTypes[extname] || 'application/octet-stream';
}

const uploadFile = async (bucketName: string, prefix: string, originUrl: string,) => {
    try {
        console.info('Preparando el archivo para subir a S3...', originUrl);
        const fileStream = createReadStream(originUrl);
        const name = path.basename(originUrl);
        const mimeType = getMimeType(name);

        const params = {
            Bucket: bucketName,
            Key: `${prefix}/${name}`, // Nombre del archivo en S3
            Body: fileStream, // El contenido del archivo
            ContentType: mimeType, // Tipo de contenido (ajústalo según el archivo)
        };

        console.info('Subiendo el archivo al S3...', originUrl);
        await s3.upload(params).promise();
        console.info('Archivo subido en el S3...', originUrl);
    } catch (error) {
        console.error('Ocurrio un error al subir el archivo en el S3...', originUrl);
    }
}

// Función para capturar parámetros de la línea de comandos
const captureParams = () => {
    const [, , action, ...args] = process.argv;

    switch (action) {
        case 'list': {
            console.log('Listando buckets...');
            listBuckets();
            break;
        }

        case 'list-folder': {
            if (args.length < 1) {
                console.error('list-folder [bucketName] [prefix]');
                console.error('Example:');
                console.error('list-folder my-bucket my-folder/');
                return;
            }
            const bucketName = args[0];
            const prefixName = args[1] ?? '';
            console.info('Listando folder...');
            listFolder(bucketName, prefixName);
            break;
        }

        case 'list-files': {
            if (args.length < 2) {
                console.error('list-files [bucketName] [prefix]');
                console.error('Example:');
                console.error('list-folder my-bucket my-folder/');
                return;
            }
            const bucketName = args[0];
            const prefixName = args[1] ?? '';
            console.log('Listando files...');
            listFiles(bucketName, prefixName);
            break;
        }

        case 'download': {
            if (args.length < 1) {
                console.error('download [bucketName] [prefix]');
                console.error('Example:');
                console.error('download my-bucket my-folder/my-file.txt');
                return;
            }
            const bucketName = args[0];
            const prefixName = args[1] ?? '';
            console.log('Descandaro files...');
            download(bucketName, prefixName);
            break;
        }
        
        case 'create': {
            if (args.length < 1) {
                console.error('create [bucketName]');
                console.error('Example:');
                console.error('create my-bucket');
                return;
            }
            const bucketName = args[0];
            console.info(`Creando bucket "${bucketName}"...`);
            createBucket(bucketName);
            break;
        }
        case 'create-folder': {
            if (args.length < 2) {
                console.error('create-folder [bucketName] [prefix]');
                console.error('Example:');
                console.error('create-folder my-bucket my-folder');
                return;
            }
            const bucketName = args[0];
            const prefix = args[1];
            console.log(`Creando bucket "${bucketName}/${prefix}"...`);
            createFolder(bucketName, prefix);
            break;
        }
        case 'copy-file': {
            if (args.length < 4) {
                console.error('copy-file [sourceBucket] [sourceKey] [destBucket] [destKey]');
                console.error('Example:');
                console.error('copy-file my-bucket source-folder/file.txt my-bucket dest-folder/file.txt');
                return;
            }
            const [sourceBucket, sourceKey, destBucket, destKey] = args;
            console.log(`Copiando archivo de "${sourceBucket}/${sourceKey}" a "${destBucket}/${destKey}"...`);
            copyFile(sourceBucket, sourceKey, destBucket, destKey);
            break;
        }
        case 'copy-folder': {
            if (args.length < 4) {
                console.error('copy-folder [sourceBucket] [sourceFolder] [destBucket] [destFolder]');
                console.error('Example:');
                console.error('copy-folder my-bucket source-folder/ my-bucket dest-folder/');
                return;
            }
            const [sourceBucketFolder, sourceFolder, destBucketFolder, destFolder] = args;
            console.log(`Copiando carpeta de "${sourceBucketFolder}/${sourceFolder}" a "${destBucketFolder}/${destFolder}"...`);
            copyFolder(sourceBucketFolder, sourceFolder, destBucketFolder, destFolder);
            break;
        }
        case 'upload-file': {
            if (args.length < 3) {
                console.error('upload-file [bucketName] [originUrl], [prefix]');
                console.error('Example:');
                console.error('upload-file my-bucket /path/to/file.txt my-folder/');
                return;
            }
            const [bucketName, originUrl, prefix] = args;
            uploadFile(bucketName, originUrl, prefix);
        }
        default: {
            console.log('Acción no reconocida. Usa "list", "list-folder", "create", "copy-file" o "copy-folder", "upload-file".');
            break;
        }
    }
};

// Llamar a la función para capturar parámetros y ejecutar la acción correspondiente
captureParams();
