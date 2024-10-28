import commonStyles from '../../styles/common.module.scss';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles['header-container']}>
      <div className={commonStyles.container}>
        <img src="/images/Logo.svg" alt="logo" />
      </div>
    </header>
  );
}
