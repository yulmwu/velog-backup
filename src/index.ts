import { fetchPost, fetchPosts } from './client'
import { getSdk, Post } from './generated/graphql'
import fs from 'fs'

const USERNAME = 'yulmwu'

interface PostWithData extends Post {
    data: Post
}

;(async () => {
    const fetched = await fetchPosts(USERNAME)

    // const post = await fetchPost('yulmwu', 'aws-serverless')
    // const posts = fetched.map((post) => {
    //     // if (!post || !post.url_slug) return;

    //     // return {
    //     //     id: post.id,
    //     //     title: post.title,
    //     //     url_slug: post.url_slug,
    //     //     data: await fetchPost(USERNAME, post.url_slug),
    //     // }
    // })

    const posts: PostWithData[] = []

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

    console.log(`Fetched ${posts.length} posts`)

    fs.writeFileSync('output.json', JSON.stringify(posts, null, 4), 'utf-8')
})()
