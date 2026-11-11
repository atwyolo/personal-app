---
descriptionShort: Webowa aplikacja czatu, w której użytkownicy rozmawiają z LLM. Odpowiadałem za cały frontend, od zbudowania interfejsu od zera po dostarczanie nowych funkcji i utrzymanie produktu na produkcji.
---

**Kluczowe osiągnięcia:**
- Zoptymalizowałem aplikację pod kątem szybkości i SEO z użyciem SSR w Next.js, osiągając wynik Lighthouse 92–95 i zwiększając ogólny współczynnik konwersji o około 12%, co potwierdziły testy A/B w GrowthBook.
- Zintegrowałem Sentry do śledzenia błędów i logowania oraz osiągnąłem 85% pokrycia testami z Vitest i React Testing Library, co zmniejszyło liczbę zgłoszeń błędów od QA o 20–25%.
- Zbudowałem strumieniowanie odpowiedzi w czasie rzeczywistym przez WebSockets, dzięki czemu czat działał szybciej i był bardziej responsywny.
- Wprowadziłem w zespole agentowe workflowy AI z Claude Code i serwerami MCP (Context7, 21st.dev, Playwright), wykorzystując AI do dzielenia zadań, generowania funkcji oraz testowania i weryfikacji wyników, co potroiło tempo dostarczania funkcji.
- Skonfigurowałem pipeline'y CI/CD do automatycznego budowania, testowania i wdrażania na Kubernetes oraz skonteneryzowałem aplikację za pomocą wieloetapowych buildów Dockera.
- Brałem udział w code review i dyskusjach o architekturze, dając konstruktywny feedback, który poprawiał jakość kodu.
