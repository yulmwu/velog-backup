import { GraphQLClient } from 'graphql-request'
import { getSdk, Post, VelogPostsQueryVariables } from './generated/graphql'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const client = new GraphQLClient('https://v2.velog.io/graphql', {
    headers: {
        Authorization: `Bearer ${process.env.VELOG_JWT_ACCESS_TOKEN}`,
    },
})

const sdk = getSdk(client)

const LIMIT = 20

const fetchPosts = async (username: string, cursor?: string, posts: Post[] = []): Promise<Post[]> => {
    const data = await sdk.velogPosts({
        cursor,
        limit: LIMIT,
        username,
    })

    if (data.posts && data.posts.length > 0) {
        posts.push(...data.posts.filter((post): post is Post => post !== null))

        if (data.posts.length < LIMIT) return posts

        const nextCursor = data.posts[data.posts.length - 1]?.id
        if (nextCursor) await fetchPosts(username, nextCursor, posts)
    }

    return posts
}

const fetchAllPosts = async () => {
    const allPosts = await fetchPosts('yulmwu')
    console.log(allPosts)
    console.log(`Total posts fetched: ${allPosts.length}`)
}

fetchAllPosts()
