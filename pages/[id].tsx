import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkMdx from "remark-mdx";
import { createPosts, getPostData, getPosts, getPostsIds } from "../lib/notion";
import { ONE_MINUTE_IN_SECONDS } from "../util/constants";
import { filterPosts } from "../util/notion";

type Props = {
  content: string;
  post: any;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts(process.env.NOTION_DATABASE_ID);
  const publishedPosts = filterPosts(posts);

  await createPosts(publishedPosts);

  const paths = getPostsIds();

  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postId = params.id as string;
  const { content, post } = await getPostData(postId);

  return {
    props: {
      content,
      post,
    },
    revalidate: ONE_MINUTE_IN_SECONDS,
  };
};

export default function BlogPost({ content, post }: Props) {
  return (
    <main>
      {/* <Link href="/">Back to homepage</Link> */}
      <article className="prose prose-quoteless prose-neutral dark:prose-invert">
        <h1>{post.properties.page.title[0].plain_text}</h1>
        <ReactMarkdown remarkPlugins={[remarkMdx]}>{content}</ReactMarkdown>
        <p>{post.properties.date.date.start}</p>
      </article>
    </main>
  );
}
