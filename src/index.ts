import { GraphQLClient } from 'graphql-request'
import { getSdk, VelogPostsQueryVariables } from './generated/graphql'

const client = new GraphQLClient('https://v2.velog.io/graphql')

const sdk = getSdk(client)

const variables: VelogPostsQueryVariables = {
    cursor: 'f8be74a7-f778-40bc-ae1e-b53cc8b71430',
    limit: 10,
    username: 'yulmwu',
}

const fetchUser = async () => {
    return await sdk.velogPosts(variables)
}

fetchUser()
    .then((data) => {
        // console.log(data)
        // console.log('Total posts fetched:', data.posts?.length)
        data.posts?.forEach((post) => {
            if (post) console.log(`${post.id} : ${post.title}`)
        })
    })
    .catch((error) => console.error('Error fetching user:', error))
