import { Post } from './generated/graphql'

export interface PostWithData extends Post {
    data: Post
}

export type PostsWithData = PostWithData[]

export interface FileWriterOptions {
    json_file: boolean
    metadata: boolean
}
