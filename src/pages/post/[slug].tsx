import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { Fragment } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle?: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface EstimatedReadingTime {
  wordsCount: number;
  readingTime: number;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const formattedPost: Post = {
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: post.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };
  const estimatedReadingTime = formattedPost.data.content.reduce(
    (acc, content) => {
      const headingWordsCount = content.heading.split(' ').length;
      const bodyWordsCount = RichText.asText(content.body).split(' ').length;

      acc.wordsCount += headingWordsCount + bodyWordsCount;
      acc.readingTime = Math.ceil(acc.wordsCount / 200);

      return acc;
    },
    {
      wordsCount: 0,
      readingTime: 0,
    } as EstimatedReadingTime
  );

  return (
    <main className={styles.post}>
      <img src={formattedPost.data.banner.url} alt="Post banner" />

      <div className={commonStyles.container}>
        <h1>{formattedPost.data.title}</h1>

        <div className={commonStyles.info}>
          <time>
            <FiCalendar size={20} /> {formattedPost.first_publication_date}
          </time>
          <span>
            <FiUser size={20} /> {formattedPost.data.author}
          </span>
          <time>
            <FiClock size={20} /> {estimatedReadingTime.readingTime} min
          </time>
        </div>

        <div className={styles.content}>
          {formattedPost.data.content.map(content => (
            <Fragment key={content.heading}>
              <h2>{content.heading}</h2>

              <div
                // eslint-disable-next-line
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const staticPaths = posts.results.slice(0, 2).map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: staticPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
