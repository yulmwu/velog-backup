import { fetchPost, fetchPosts } from './client'
import fs from 'fs'
import { PostsWithData } from './types'
import { fileWrite } from './writer'
import { BASE_PATH, USERNAME } from './config'

const main = async () => {
    if (fs.existsSync(BASE_PATH))
        fs.rm(BASE_PATH, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error(`Failed to remove existing backup directory: ${err.message}`)
                process.exit(1)
            }
        })

    const fetched = await fetchPosts(USERNAME)
    const posts: PostsWithData = []

    for (const post of fetched) {
        if (!post) {
            console.error('Post is null or undefined, skipping...')
            continue
        }

        if (!post.url_slug) {
            console.error(`Post with ID ${post.id} has no url_slug, skipping...`)
            continue
        }

        const data = await fetchPost(USERNAME, post.url_slug)
        if (!data) {
            console.error(`Failed to fetch post ${post.url_slug}`)
            continue
        }

        posts.push({
            id: post.id,
            title: post.title,
            url_slug: post.url_slug,
            data,
        })
    }

    fileWrite(posts, {
        json_file: true,
        metadata: true,
    })

    console.log(`Fetched ${posts.length} posts`)
}

main()
    .then(() => console.log('Backup completed successfully'))
    .catch((error) => {
        console.error('Error during backup:', error)
        process.exit(1)
    })
