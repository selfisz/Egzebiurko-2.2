# 🔧 Refactoring Egzebiurko 2.2 → 3.0

## 📋 Cel Refactoringu

Migracja z monolitycznej architektury na nowoczesną, modularną strukturę z:
- ✅ ES6 Modules (import/export)
- ✅ Centralny State Management
- ✅ Vite bundler
- ✅ Lepsza organizacja kodu
- ✅ Przygotowanie pod TypeScript

---

## 🏗️ Nowa Struktura Projektu

```
Egzebiurko-2.2/
├── src/                          # Nowy kod źródłowy (ES6 modules)
│   ├── main.js                   # Entry point
│   ├── store/                    # State Management
│   │   └── index.js              # Główny store
│   ├── modules/                  # Moduły aplikacji
│   │   ├── tracker/
│   │   │   ├── index.js          # Export modułu
│   │   │   ├── TrackerView.js    # Komponent widoku
│   │   │   ├── TrackerStore.js   # Store modułu
│   │   │   └── utils.js          # Pomocnicze funkcje
│   │   ├── cars/
│   │   ├── terrain/
│   │   ├── finance/
│   │   ├── notes/
│   │   ├── links/
│   │   ├── generator/
│   │   ├── registry/
│   │   ├── ai/
│   │   ├── quickActions/
│   │   ├── globalSearch/
│   │   ├── statistics/
│   │   └── security/
│   ├── utils/                    # Wspólne narzędzia
│   │   ├── db.js                 # IndexedDB wrapper
│   │   ├── validation.js         # Walidacje (NIP, PESEL)
│   │   ├── dates.js              # Operacje na datach
│   │   └── formatting.js         # Formatowanie danych
│   ├── components/               # Reużywalne komponenty
│   │   ├── Modal.js
│   │   ├── Toast.js
│   │   ├── Sidebar.js
│   │   └── SearchBar.js
│   └── styles/                   # Style
│       ├── main.css
│       ├── components.css
│       └── themes.css
├── public/                       # Statyczne pliki
│   ├── images/
│   └── fonts/
├── dist/                         # Build output (generowany)
├── js/                           # Stary kod (do migracji)
├── index.html                    # Główny HTML
├── vite.config.js                # Konfiguracja Vite
├── package.json                  # Dependencies
└── README.md                     # Dokumentacja

```

---

## 🚀 Kroki Migracji

### **Faza 1: Setup (DONE ✅)**
- [x] Utworzenie `package.json`
- [x] Konfiguracja Vite (`vite.config.js`)
- [x] Utworzenie centralnego Store (`src/store/index.js`)
- [x] Nowa struktura folderów

### **Faza 2: Migracja Utilities**
- [ ] Przenieś `js/db.js` → `src/utils/db.js` (ES6)
- [ ] Przenieś `js/utils.js` → `src/utils/` (podziel na moduły)
- [ ] Przenieś `js/config.js` → `src/config.js`
- [ ] Dodaj `src/utils/validation.js` (NIP, PESEL)
- [ ] Dodaj `src/utils/dates.js` (operacje na datach)

### **Faza 3: Migracja Modułów (Priorytet)**
1. **Tracker** (największy moduł)
   - Podziel na: View, Store, Utils
   - Użyj centralnego store
   - Dodaj testy

2. **QuickActions** (nowy, prosty)
   - Migruj jako pierwszy przykład
   - Dokumentuj proces

3. **GlobalSearch** (nowy)
   - Integracja z store
   - Reaktywne wyniki

4. **Statistics** (nowy)
   - Pobieranie danych ze store
   - Generowanie raportów

5. **Security** (nowy)
   - Middleware dla routingu
   - Integracja z store

### **Faza 4: Komponenty UI**
- [ ] `src/components/Modal.js`
- [ ] `src/components/Toast.js`
- [ ] `src/components/Sidebar.js`
- [ ] `src/components/SearchBar.js`

### **Faza 5: Routing**
- [ ] Implementacja routera (history API)
- [ ] Lazy loading modułów
- [ ] Guards (security)

### **Faza 6: Testing**
- [ ] Setup Jest
- [ ] Testy jednostkowe dla utils
- [ ] Testy integracyjne dla store
- [ ] Testy E2E (opcjonalnie Playwright)

### **Faza 7: TypeScript (Opcjonalnie)**
- [ ] Konfiguracja TypeScript
- [ ] Migracja stopniowa (.js → .ts)
- [ ] Typy dla store i API

---

## 📖 Przykład Migracji Modułu

### **Przed (Stary kod - js/modules/quickActions.js):**
```javascript
// Global scope, brak modularności
const QUICK_ACTIONS = [...];

function initQuickActions() {
  // ...
}

window.quickActionsModule = {
  init: initQuickActions
};
```

### **Po (Nowy kod - src/modules/quickActions/index.js):**
```javascript
// ES6 module
import store from '@store';
import { createModal } from '@components/Modal';

const QUICK_ACTIONS = [...];

export class QuickActionsModule {
  constructor() {
    this.visible = false;
    this.init();
  }

  init() {
    this.createFloatingButton();
    this.createPanel();
    this.setupKeyboardShortcuts();
  }

  createFloatingButton() {
    // ...
  }

  toggle() {
    this.visible = !this.visible;
    // Użyj store zamiast bezpośredniej manipulacji DOM
    store.commit('SET_QUICK_ACTIONS_VISIBLE', this.visible);
  }
}

export default new QuickActionsModule();
```

---

## 🎯 Korzyści Nowej Architektury

### **1. Modularność**
- Każdy moduł jest niezależny
- Łatwe dodawanie/usuwanie funkcji
- Reużywalność kodu

### **2. Maintainability**
- Jasna struktura
- Łatwiejsze debugowanie
- Kod review przyjemniejszy

### **3. Performance**
- Tree shaking (Vite usuwa nieużywany kod)
- Code splitting (lazy loading)
- Optymalizacja bundla

### **4. Developer Experience**
- Hot Module Replacement (HMR)
- Szybki rebuild
- Lepsza obsługa błędów

### **5. Testability**
- Izolowane moduły
- Mockowanie zależności
- CI/CD ready

---

## 🔄 State Management - Przykłady Użycia

### **Subskrypcja zmian:**
```javascript
import store from '@store';

// Nasłuchuj zmian w cases
store.subscribe('cases', (newCases, oldCases) => {
  console.log('Cases updated:', newCases);
  renderCasesList(newCases);
});
```

### **Mutacje (synchroniczne):**
```javascript
// Zmień moduł
store.commit('SET_CURRENT_MODULE', 'tracker');

// Dodaj sprawę
store.commit('ADD_CASE', caseData);
```

### **Akcje (asynchroniczne):**
```javascript
// Załaduj sprawy z bazy
await store.dispatch('loadCases');

// Zapisz sprawę
await store.dispatch('saveCase', caseData);
```

### **Pobieranie danych:**
```javascript
// Bezpośredni dostęp
const cases = store.get('cases');
const currentModule = store.get('currentModule');
```

---

## 📦 Instalacja i Uruchomienie

### **1. Instalacja zależności:**
```bash
npm install
```

### **2. Development server:**
```bash
npm run dev
```
Aplikacja dostępna na: `http://localhost:3000`

### **3. Build produkcyjny:**
```bash
npm run build
```
Output w folderze `dist/`

### **4. Preview buildu:**
```bash
npm run preview
```

### **5. Testy:**
```bash
npm test              # Uruchom raz
npm run test:watch    # Watch mode
```

---

## ⚠️ Backward Compatibility

Podczas migracji **stary kod nadal działa**:
- Stare pliki w `js/` są ładowane przez `index.html`
- Nowe moduły w `src/` są opcjonalne
- Stopniowa migracja bez breaking changes

**Plan:**
1. Nowe funkcje piszemy w `src/`
2. Stopniowo migrujemy stare moduły
3. Gdy wszystko działa, usuwamy `js/`

---

## 🐛 Troubleshooting

### **Problem: Vite nie startuje**
```bash
# Wyczyść cache
rm -rf node_modules dist
npm install
```

### **Problem: Import errors**
- Sprawdź alias w `vite.config.js`
- Użyj `@` zamiast względnych ścieżek

### **Problem: Store nie działa**
- Upewnij się, że store jest zaimportowany przed użyciem
- Sprawdź czy mutacje/akcje są zarejestrowane

---

## 📚 Dalsze Kroki

1. **Przeczytaj dokumentację Vite:** https://vitejs.dev/
2. **Zapoznaj się z ES6 Modules:** https://javascript.info/modules
3. **Zrozum Proxy API:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
4. **Opcjonalnie TypeScript:** https://www.typescriptlang.org/

---

## 🤝 Contributing

Przy dodawaniu nowych funkcji:
1. Twórz w `src/modules/[nazwa]/`
2. Używaj ES6 modules (import/export)
3. Integruj ze store
4. Dodaj testy
5. Dokumentuj w README

---

## 📝 TODO

- [ ] Migracja wszystkich modułów
- [ ] Dodanie testów
- [ ] TypeScript
- [ ] CI/CD pipeline
- [ ] Dokumentacja API
- [ ] Storybook dla komponentów

---

**Status:** 🚧 W trakcie refactoringu
**Wersja:** 3.0.0-alpha
**Data:** Grudzień 2024
