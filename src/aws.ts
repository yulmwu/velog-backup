import fs from 'fs'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import archiver from 'archiver'
import { BASE_PATH } from './config'

const s3Client = new S3Client()

const zipDirectory = async (sourceDir: string, outPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => {
            console.log(`Created zip file: ${outPath} (${archive.pointer()} bytes)`)
            resolve()
        })

        archive.on('error', reject)

        archive.pipe(output)
        archive.directory(sourceDir, false)
        archive.finalize()
    })
}

const uploadToS3 = async (bucket: string, key: string, filePath: string): Promise<void> => {
    const fileStream = fs.createReadStream(filePath)

    const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: 'application/zip',
    }

    await s3Client.send(new PutObjectCommand(uploadParams))
    console.log(`Uploaded ${key} to S3 bucket ${bucket}`)
}

export const purgeS3Bucket = async (limit: number = 5) => {
    const bucket = process.env.AWS_S3_BUCKET_NAME
    const listParams = {
        Bucket: bucket,
    }

    const data = await s3Client.send(new ListObjectsV2Command(listParams))
    if (!data.Contents) return

    const sortedFiles = data.Contents.sort(
        (a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
    )
    const filesToDelete = sortedFiles.slice(limit)

    if (filesToDelete.length === 0) {
        console.log('No files to delete')
        return
    }

    const deleteParams = {
        Bucket: bucket,
        Delete: {
            Objects: filesToDelete.map((file) => ({ Key: file.Key! })),
        },
    }

    const result = await s3Client.send(new DeleteObjectsCommand(deleteParams))
    console.log(result)

    console.log(`Deleted ${filesToDelete.length} old files from S3 bucket ${bucket}: ${filesToDelete.map(f => f.Key).join(', ')}`)
}

export const uploadS3 = async () => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME
    if (!bucketName) {
        console.error('AWS_S3_BUCKET_NAME environment variable is not set')
        return
    }

    if (!fs.existsSync(BASE_PATH)) {
        console.error(`Base path ${BASE_PATH} does not exist. Please run the backup script first.`)
        return
    }

    const zipPath = `/tmp/backup.zip`
    await zipDirectory(BASE_PATH, zipPath)

    await uploadToS3(bucketName, `backup-${new Date().toISOString()}.zip`, zipPath)
}
