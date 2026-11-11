import { defaultLocale, type Locale, locales } from "@/shared/lib/locales";

export interface ErrorTexts {
  metaTitle: string;
  label: string;
  title: string;
  text: string;
  errorId: string;
  reload: string;
  reloading: string;
}

export const errorTexts: Record<Locale, ErrorTexts> = {
  en: {
    metaTitle: "Something went wrong — Mikhail Aleksandrov",
    label: "Error 500 · Something went wrong",
    title: "Something broke on my side",
    text: "It’s not you. Reload the page, and if it keeps happening, try again in a few minutes.",
    errorId: "Error ID:",
    reload: "Reload page",
    reloading: "Reloading…",
  },
  ru: {
    metaTitle: "Что-то пошло не так — Михаил Александров",
    label: "Ошибка 500 · Что-то пошло не так",
    title: "Что-то сломалось на моей стороне",
    text: "Дело не в вас. Перезагрузите страницу, а если ошибка повторится, попробуйте снова через несколько минут.",
    errorId: "ID ошибки:",
    reload: "Перезагрузить страницу",
    reloading: "Перезагрузка…",
  },
  pt: {
    metaTitle: "Algo deu errado — Mikhail Aleksandrov",
    label: "Erro 500 · Algo deu errado",
    title: "Algo quebrou do meu lado",
    text: "O problema não é com você. Recarregue a página e, se continuar acontecendo, tente de novo em alguns minutos.",
    errorId: "ID do erro:",
    reload: "Recarregar página",
    reloading: "Recarregando…",
  },
  es: {
    metaTitle: "Algo salió mal — Mikhail Aleksandrov",
    label: "Error 500 · Algo salió mal",
    title: "Algo falló de mi lado",
    text: "El problema no es suyo. Recargue la página y, si sigue ocurriendo, vuelva a intentarlo en unos minutos.",
    errorId: "ID del error:",
    reload: "Recargar la página",
    reloading: "Recargando…",
  },
  de: {
    metaTitle: "Etwas ist schiefgelaufen — Mikhail Aleksandrov",
    label: "Fehler 500 · Etwas ist schiefgelaufen",
    title: "Bei mir ist etwas kaputtgegangen",
    text: "Es liegt nicht an Ihnen. Laden Sie die Seite neu, und wenn es wieder passiert, versuchen Sie es in ein paar Minuten noch einmal.",
    errorId: "Fehler-ID:",
    reload: "Seite neu laden",
    reloading: "Wird neu geladen…",
  },
  fr: {
    metaTitle: "Une erreur est survenue — Mikhail Aleksandrov",
    label: "Erreur 500 · Une erreur est survenue",
    title: "Quelque chose a cassé de mon côté",
    text: "Ce n’est pas de votre faute. Rechargez la page et, si le problème persiste, réessayez dans quelques minutes.",
    errorId: "ID de l’erreur :",
    reload: "Recharger la page",
    reloading: "Rechargement…",
  },
  ja: {
    metaTitle: "エラーが発生しました — Mikhail Aleksandrov",
    label: "エラー 500 · 問題が発生しました",
    title: "こちら側で問題が起きました",
    text: "お客様の操作に問題はありません。ページを再読み込みしてください。解決しない場合は、数分後にもう一度お試しください。",
    errorId: "エラー ID:",
    reload: "ページを再読み込み",
    reloading: "再読み込み中…",
  },
  pl: {
    metaTitle: "Coś poszło nie tak — Mikhail Aleksandrov",
    label: "Błąd 500 · Coś poszło nie tak",
    title: "Coś zepsuło się po mojej stronie",
    text: "Przyczyna nie leży po Państwa stronie. Proszę odświeżyć stronę, a jeśli błąd się powtórzy, spróbować ponownie za kilka minut.",
    errorId: "ID błędu:",
    reload: "Odśwież stronę",
    reloading: "Odświeżanie…",
  },
};

export const getErrorLocale = (pathname: string): Locale => {
  const [, segment = ""] = pathname.split("/");

  return locales.find((locale) => locale === segment) ?? defaultLocale;
};
