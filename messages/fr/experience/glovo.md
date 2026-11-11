---
descriptionShort: Une application web de chat permettant aux utilisateurs d’échanger avec un LLM. J’ai pris en charge tout le frontend, de la création de l’interface à partir de zéro jusqu’à la livraison de nouvelles fonctionnalités et au support du produit en production.
---

**Réalisations clés :**
- Optimisation de l’application pour la vitesse et le SEO grâce au SSR de Next.js : un score Lighthouse de 92 à 95 et un taux de conversion global en hausse d’environ 12 %, validé par des tests A/B dans GrowthBook.
- Intégration de Sentry pour le suivi des erreurs et la journalisation, et 85 % de couverture de tests avec Vitest et React Testing Library, ce qui a réduit de 20 à 25 % les rapports de bugs de la QA.
- Mise en place du streaming des réponses en temps réel via WebSockets, pour un chat plus rapide et plus réactif.
- Introduction dans l’équipe de workflows d’AI agentique avec Claude Code et des serveurs MCP (Context7, 21st.dev, Playwright) : l’AI servait à découper les tickets, générer des fonctionnalités, puis tester et vérifier le résultat, ce qui a triplé la vitesse de livraison.
- Mise en place de pipelines CI/CD pour le build, les tests et le déploiement automatisés sur Kubernetes, et conteneurisation de l’application avec des builds Docker multi-étapes.
- Participation aux revues de code et aux discussions d’architecture, avec des retours constructifs pour améliorer la qualité du code.
