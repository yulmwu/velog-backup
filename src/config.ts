import path from 'path'

export const REGEX_IMAGE_URL = /!\[([^\]]*)\]\(([^)]+)\)/g
export const REGEX_IMAGE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
export const USERNAME = 'yulmwu'
export const BASE_PATH = `/tmp/backup`
export const IMAGE_DIR_NAME = 'images'
export const POST_DIR_NAME = 'posts'
export const IMAGE_DIR = path.join(BASE_PATH, IMAGE_DIR_NAME)
export const POST_DIR = path.join(BASE_PATH, POST_DIR_NAME)
export const THUMBNAIL_DIR_NAME = 'thumbnails'
export const THUMBNAIL_DIR = path.join(BASE_PATH, THUMBNAIL_DIR_NAME)
