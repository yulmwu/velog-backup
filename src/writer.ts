import path from 'path'
import fs from 'fs'
import { FileWriterOptions, PostsWithData } from './types'
import { Post } from './generated/graphql'
import {
    BASE_PATH,
    IMAGE_DIR,
    IMAGE_DIR_NAME,
    POST_DIR,
    REGEX_IMAGE_URL,
    REGEX_IMAGE_UUID,
    THUMBNAIL_DIR,
    THUMBNAIL_DIR_NAME,
} from './config'
import axios from 'axios'

const whiteSpaceReplace = (str: string): string => str.replace(/\s+/g, '-').toLowerCase()
const dateFormat = (date: string): string => new Date(date).toISOString().split('T')[0]

const imageDownload = (url: string, path: string) => {
    if (fs.existsSync(path)) {
        console.log(`Image already exists at ${path}, skipping download`)
        return
    }

    axios({
        method: 'get',
        url,
        responseType: 'stream',
    })
        .then((response) => {
            response.data.pipe(fs.createWriteStream(path)).on('error', (err: Error) => {
                console.error(`Error saving image: ${err.message}`)
            })
        })
        .catch((err) => {
            console.error(`Failed to download image from ${path}: ${err.message}`)
        })
}

export const imageExtract = (post: Post): Post => {
    if (!post.body) return post

    const matches = [...post.body.matchAll(REGEX_IMAGE_URL)]

    for (const match of matches) {
        const altText = match[1]
        const imageUrl = match[2]
        const imageExt = path.extname(imageUrl)

        const imageUuidMatch = imageUrl.match(REGEX_IMAGE_UUID)
        if (!imageUuidMatch) {
            console.error(`Failed to extract image UUID from URL: ${imageUrl}`)
            continue
        }

        const imageUuid = imageUuidMatch[0]

        const formattedDate = dateFormat(post.released_at)
        const postSlug = whiteSpaceReplace(post.url_slug!)

        const seriesName = post.series ? whiteSpaceReplace(post.series.name!) : null
        const seriesPath = seriesName ? path.join(IMAGE_DIR, seriesName) : IMAGE_DIR

        const postPath = path.join(seriesPath, `${formattedDate}-${postSlug}`)

        post.body = post.body.replace(
            match[0],
            seriesName
                ? `![${altText}](../../${IMAGE_DIR_NAME}/${seriesName}/${formattedDate}-${postSlug}/${imageUuid}.${imageExt})`
                : `![${altText}](../${IMAGE_DIR_NAME}/${formattedDate}-${postSlug}/${imageUuid}.${imageExt})`
        )

        fs.mkdirSync(postPath, { recursive: true })

        const imagePath = path.join(postPath, `${imageUuid}.${imageExt}`)
        imageDownload(imageUrl, imagePath)
    }

    return post
}

const thumbnailExtract = (post: Post): string | null => {
    if (!post.thumbnail) return null
    const thumbnailExt = path.extname(post.thumbnail)

    const thumbnailPath = post.series
        ? path.join(
              THUMBNAIL_DIR,
              whiteSpaceReplace(post.series.name!),
              `${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}`
          )
        : path.join(THUMBNAIL_DIR, `${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}`)

    fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true })
    imageDownload(post.thumbnail, thumbnailPath)

    return post.series
        ? `../../${THUMBNAIL_DIR_NAME}/${whiteSpaceReplace(post.series.name!)}/${whiteSpaceReplace(
              post.url_slug!
          )}${thumbnailExt}`
        : `../${THUMBNAIL_DIR_NAME}/${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}`
}

/*
---
title: Example Post (.title)
description: This is an example post for testing. (.short_description)
slug: 2024-01-01-example-post (date+.url_slug)
author: Author Name (.user.username)
date: 2022-09-26 20:38:00 +0900 (.released_at)
updated_at: 2022-09-26 20:38:00 +0900 (.updated_at)
categories: ["Series Name"] (.series.name) 
tags: ["tag1", "tag2"] (.tags)
series:
  name: Series Name (.series.name)
  slug: series-name (.series.url_slug)
thumbnail: https://example.com/thumbnail.png (.thumbnail)
linked_posts:
  previous: 2024-01-01-url_slug_of_previous_post (.linked_posts.previous)
  next: 2024-01-01-url_slug_of_next_post (.linked_posts.next)
is_private: false (.is_private)
---

body
*/

export const fileWrite = (posts: PostsWithData, options: FileWriterOptions) => {
    if (options.json_file) {
        if (!fs.existsSync(BASE_PATH)) {
            fs.mkdirSync(BASE_PATH, { recursive: true })
        }

        const jsonPath = path.join(BASE_PATH, '_output.json')
        fs.writeFileSync(jsonPath, JSON.stringify(posts, null, 4), 'utf-8')
    }

    for (const post of posts) {
        if (!post.data) {
            console.error(`Post ${post.url_slug} has no data, skipping...`)
            continue
        }

        post.data = imageExtract(post.data)

        const formattedDate = dateFormat(post.data.released_at)
        const postSlug = whiteSpaceReplace(post.url_slug!)

        if (options.metadata) {
            const thumbnailPath = thumbnailExtract(post.data)
            const metadata = `
---
title: "${post.data.title}"
description: "${post.data.short_description ?? 'No description provided'}"
slug: "${formattedDate}-${postSlug}"
author: ${post.data.user!.username ?? 'Unknown Author'}
date: ${post.data.released_at}
updated_at: ${post.data.updated_at}
categories: ${post.data.series ? `["${post.data.series.name}"]` : '[]'}
tags: ${post.data.tags && post.data.tags.length > 0 ? `["${post.data.tags.join('", "')}"]` : '[]'}${
                post.data.series
                    ? `\nseries:
  name: ${post.data.series ? post.data.series.name : ''}
  slug: ${post.data.series ? whiteSpaceReplace(post.data.series.url_slug!) : ''}`
                    : ''
            }${thumbnailPath ? `\nthumbnail: ${thumbnailPath}` : ''}
linked_posts:
  previous: ${
      post.data.linked_posts?.previous
          ? `${formattedDate}-${whiteSpaceReplace(post.data.linked_posts.previous.url_slug!)}`
          : ''
  }
  next: ${
      post.data.linked_posts?.next ? `${formattedDate}-${whiteSpaceReplace(post.data.linked_posts.next.url_slug!)}` : ''
  }
is_private: ${post.data.is_private}
---
`.trim()

            post.data.body = metadata + '\n\n' + (post.data.body ?? '')
        }

        const postPath = path.join(
            POST_DIR,
            post.data.series ? whiteSpaceReplace(post.data.series.name!) : '',
            `${formattedDate}-${postSlug}.md`
        )
        fs.mkdirSync(path.dirname(postPath), { recursive: true })
        fs.writeFileSync(postPath, post.data.body!, 'utf-8')
    }
}
