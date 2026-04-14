import { useLanguageStore } from '@/store/language-store'

export function useLanguage() {
  const { language, setLanguage } = useLanguageStore()
  return {
    language,
    isHindi: language === 'hi',
    setLanguage,
  }
}
