import * as fs from "fs";
import path from "path";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { remark } from "remark";
import mdx from "remark-mdx";
import { BlogPost } from "../types/notion";
import slugify from "slugify";

const POSTS_DIR = path.join(process.cwd(), "posts");

const notionClient = new Client({
  auth: process.env.NOTION_INTERNAL_INTEGRATION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient });

export async function getPosts(databaseId) {
  const response = await notionClient.databases.query({
    database_id: databaseId,
  });

  return response.results as BlogPost[];
}

export async function getPostBySlug(databaseId: string, slug: string) {
  const posts = await getPosts(databaseId);

  return posts.find(
    (post) =>
      slugify(
        post.properties.article.rich_text[0].plain_text,
        "-"
      ).toLowerCase() === slug
  );
}

export function getPostsIds() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR);
  }

  const fileNames = fs.readdirSync(POSTS_DIR);

  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.mdx$/, ""),
      },
    };
  });
}

export async function createPosts(posts: BlogPost[]) {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR);
  }

  for (const post of posts) {
    const uuid = (post.properties.article as any).rich_text[0].href.split(
      "https://www.notion.so/"
    )[1];

    // const slug = post.properties.slug.rich_text[0].plain_text;
    const slug = slugify(
      post.properties.article.rich_text[0].plain_text,
      "-"
    ).toLowerCase();
    const mdblocks = await n2m.pageToMarkdown(uuid);

    const mdString = n2m.toMarkdownString(mdblocks);
    const filename = `${POSTS_DIR}/${slug}.mdx`;

    fs.writeFile(filename, mdString.parent, (err) => {
      err !== null && console.log(err);
    });
  }
}

export async function getPostData(id: string) {
  const fullPath = path.join(POSTS_DIR, `${id}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const processedContent = await remark().use(mdx).process(fileContents);
  const contentHtml = processedContent.toString();

  const post = await getPostBySlug(process.env.NOTION_DATABASE_ID, id);

  return { content: contentHtml, post };
}

export { notionClient };
