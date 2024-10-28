import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  return (
    <main className={commonStyles.container}>
      <div className={styles.posts}>
        {postsPagination.results.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <time>
                  <FiCalendar size={20} /> {post.first_publication_date}
                </time>
                <span>
                  <FiUser size={20} /> {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {postsPagination.next_page && (
        <button type="button" className={styles['load-posts-button']}>
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps<{
  postsPagination: PostPagination;
}> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 4,
    }
  );

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
