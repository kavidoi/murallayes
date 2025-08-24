import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useDocumentTitle = (titleKey?: string, staticTitle?: string) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Default title
    const defaultTitle = 'Muralla Admin';
    
    let title = defaultTitle;
    
    if (staticTitle) {
      title = `${staticTitle} - ${defaultTitle}`;
    } else if (titleKey) {
      const translatedTitle = t(titleKey);
      title = `${translatedTitle} - ${defaultTitle}`;
    }
    
    document.title = title;
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = defaultTitle;
    };
  }, [titleKey, staticTitle, t]);
};