import { GetStaticProps } from "next";
import { getPosts } from "../lib/notion";
import { filterPosts, sortPosts } from "../util/notion";
import { BlogPost } from "../types/notion";
import { ONE_MINUTE_IN_SECONDS } from "../util/constants";
import Link from "next/link";
import slugify from "slugify";

type Props = {
  posts: BlogPost[];
};

export const getStaticProps: GetStaticProps = async () => {
  const posts = await getPosts(process.env.NOTION_DATABASE_ID);
  const publishedPosts = filterPosts(posts);
  const sortedPosts = sortPosts(publishedPosts);

  return {
    props: {
      posts: sortedPosts,
    },
    revalidate: ONE_MINUTE_IN_SECONDS,
  };
};

export default function Home({ posts }: Props) {
  return (
    <section className="prose prose-quoteless prose-neutral dark:prose-invert">
      {posts.map((post) => {
        const title = post.properties.article.rich_text[0].plain_text;
        const description = post.properties.abstract.rich_text[0].plain_text;
        const publishDate = post.properties.date.date.start;
        const url = `/${slugify(
          post.properties.article.rich_text[0].plain_text,
          "-"
        ).toLowerCase()}`;
        // const tags = post.properties.tags.multi_select
        //   .map(({ name }) => name)
        //   .join(", ");

        return (
          <article key={post.id}>
            <Link href={url}>
              <h3>{title}</h3>
            </Link>

            <p>{description}</p>

            <ul>
              <li>Published: {publishDate}</li>
              {/* <li>Tags: {tags}</li> */}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
