import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_META, LANGUAGES, useLanguage } from '@/i18n'
import { cn } from '@/shared/lib'
import { Button } from './Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu'
import { Tooltip } from './Tooltip'

/** Compact language menu for the top bar. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()
  return (
    <DropdownMenu>
      <Tooltip content={t('topbar.language')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={cn('gap-1.5 px-2', className)} aria-label={t('topbar.language')}>
            <Languages />
            <span className="text-xs font-semibold uppercase">{language}</span>
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang} onSelect={() => setLanguage(lang)}>
            <span aria-hidden>{LANGUAGE_META[lang].flag}</span>
            <span className="flex-1">{LANGUAGE_META[lang].nativeLabel}</span>
            {lang === language ? <Check className="text-brand-fg" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Segmented control variant for settings pages. */
export function LanguageSegmented({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  return (
    <div role="radiogroup" className={cn('inline-flex h-9 items-center gap-1 rounded-lg bg-bg-subtle p-1', className)}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          role="radio"
          aria-checked={lang === language}
          onClick={() => setLanguage(lang)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
            lang === language ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
          )}
        >
          <span aria-hidden>{LANGUAGE_META[lang].flag}</span>
          {LANGUAGE_META[lang].nativeLabel}
        </button>
      ))}
    </div>
  )
}
