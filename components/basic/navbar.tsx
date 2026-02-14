'use client';

import {
  Button,
  Navbar as HeroUINavbar,
  Input,
  Kbd,
  Link,
  NavbarBrand,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
} from '@heroui/react';
import { link as linkStyles } from '@heroui/theme';
import clsx from 'clsx';
import Image from 'next/image';
import NextLink from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

import { GithubIcon, SearchIcon } from '@/components/basic/icons';
import { ThemeSwitch } from '@/components/basic/theme-switch';
import { buildIconProxyUrl } from '@/utils/icon-proxy';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useNodeSearch } from '../context/NodeSearchContext';
import { usePageConfig } from '../context/PageConfigContext';
import { useConfig } from '../utils/swr';
import { I18NSwitch } from './i18n-switch';

export const Navbar = () => {
  const t = useTranslations();
  const { inputValue, setInputValue, clearSearch, isFiltering } = useNodeSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  // shortcut key (Command+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pageConfig = usePageConfig();
  const { config: globalConfig } = useConfig();
  const showEditPage = pageConfig.isEditThisPage;

  const resolvedTitle = globalConfig?.config.title || pageConfig.siteMeta.title;

  const homeHref = pageConfig.pageId === pageConfig.defaultPageId ? '/' : `/${pageConfig.pageId}`;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    [setInputValue]
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      setInputValue((e.target as HTMLInputElement).value);
    },
    [setInputValue]
  );

  const handleClearSearch = useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  const searchInput = (
    <div className="relative">
      <Input
        aria-label={t('navbar.search')}
        classNames={{
          inputWrapper: 'bg-default-100',
          input: 'text-sm',
        }}
        endContent={
          !isFiltering && (
            <Kbd className="hidden lg:inline-block" keys={['command']}>
              K
            </Kbd>
          )
        }
        ref={inputRef}
        value={inputValue}
        onChange={handleSearchChange}
        onCompositionEnd={handleCompositionEnd}
        isClearable={isFiltering}
        onClear={handleClearSearch}
        labelPlacement="outside"
        placeholder={t('node.search')}
        startContent={
          <SearchIcon className="text-base text-default-400 pointer-events-none shrink-0" />
        }
        type="search"
      />
    </div>
  );

  const starButton = (
    <Button
      isExternal
      as={Link}
      className="text-sm font-normal text-default-600 bg-default-100"
      href="https://github.com/Alice39s/kuma-mieru"
      startContent={<GithubIcon />}
      variant="flat"
    >
      Star on Github
    </Button>
  );

  const getIconUrl = () => buildIconProxyUrl(pageConfig.pageId) || '/icon.svg';
  const navItems = [
    {
      label: 'page.main',
      href: '/',
      external: false,
    },
    ...(showEditPage
      ? [
          {
            label: 'page.edit',
            href: `/api/manage-status-page?pageId=${encodeURIComponent(pageConfig.pageId)}`,
            external: true,
          },
        ]
      : []),
  ];

  return (
    <HeroUINavbar maxWidth="xl" position="static">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href={homeHref}>
            <Image
              src={getIconUrl() || '/icon.svg'}
              alt={`${resolvedTitle} logo`}
              width={34}
              height={34}
            />
            <p className="font-bold text-inherit">{resolvedTitle}</p>
          </NextLink>
        </NavbarBrand>
        <nav aria-label={t('navbar.main')}>
          <ul className="hidden lg:flex gap-4 justify-start ml-2">
            {navItems.map(item => {
              const targetHref = item.href === '/' ? homeHref : item.href;
              return (
                <li key={item.href}>
                  <NextLink
                    className={clsx(
                      linkStyles({ color: 'foreground' }),
                      'data-[active=true]:text-primary data-[active=true]:font-medium'
                    )}
                    color="foreground"
                    href={targetHref}
                    target={item.external ? '_blank' : '_self'}
                  >
                    {t(item.label)}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <nav aria-label={t('navbar.toolbar')}>
          <ul className="flex items-center gap-4">
            <li>
              <ThemeSwitch />
            </li>
            <li>
              <I18NSwitch />
            </li>
            <li className="hidden lg:block">
              <div className="flex flex-col">{searchInput}</div>
            </li>
            <li className="hidden sm:block">{pageConfig.isShowStarButton && starButton}</li>
          </ul>
        </nav>
      </NavbarContent>

      {/* 移动端 */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <nav aria-label={t('navbar.toolbar')}>
          <ul className="flex items-center gap-2">
            <li>
              <ThemeSwitch />
            </li>
            <li>
              <I18NSwitch />
            </li>
            <li>
              <NavbarMenuToggle
                icon={isOpen => (
                  <motion.div
                    variants={{
                      closed: { rotate: 0, opacity: 1 },
                      open: { rotate: 90, opacity: 1 },
                    }}
                    animate={isOpen ? 'open' : 'closed'}
                    transition={{ duration: 0.3 }}
                    className="text-default-500"
                  >
                    {isOpen ? <X width={24} /> : <Menu size={24} />}
                  </motion.div>
                )}
              />
            </li>
          </ul>
        </nav>
      </NavbarContent>

      <NavbarMenu className="z-60">
        {pageConfig.isShowStarButton && starButton}
        <div className="flex flex-col gap-4">{searchInput}</div>
        <nav aria-label={t('navbar.mobileNav')}>
          <ul className="mx-4 mt-4 flex flex-col gap-2">
            {navItems.map((item, index) => {
              const targetHref = item.href === '/' ? homeHref : item.href;

              return (
                <li key={`${item.href}-${index}`}>
                  <Link
                    color={item.external ? 'danger' : 'foreground'}
                    href={targetHref}
                    target={item.external ? '_blank' : '_self'}
                    size="lg"
                  >
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
