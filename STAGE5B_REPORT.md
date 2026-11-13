# CHRONOS — STAGE 5B: AION Interactive Atelier

**Дата:** 12 ноября 2026 года.  
**Frontend:** `web/`\
**Статус:** реализовано и проверено локально. Публикация не выполнялась.

## 1. Executive summary

Существующий просмотрщик раскрывается в **AION INTERACTIVE ATELIER**: полноэкранный интерфейс с тремя группами отделки, четырьмя ракурсами, ограниченным zoom, Reset to Original и Return to Website. Во время открытия сохраняются React identity, Canvas, объект модели, geometry и texture resources.

При закрытии Hero снова получает hardened Original и исходную responsive-камеру. Выбранная конфигурация хранится только в памяти сессии Atelier и может быть продолжена при следующем открытии. Reset явно восстанавливает все три категории и полный ракурс.

Работа выполнена по аудиту **`CHRONOS/STAGE5A_REPORT.md`**. Указанного в задании `web/STAGE5A_REPORT.md` в исходной структуре нет; использован существующий полный отчёт в корне CHRONOS. Файл не перемещался и не дублировался.

Новых npm-зависимостей, моделей, текстур, сцен, секций сайта, платёжных или внешних сервисов нет. Исходные Blender/GLB, изображения и их веб-копии сохранены.

## 2. Files created and modified

Все пути ниже относительно `web/`.

### Изменены

| Файл | Изменение |
| --- | --- |
| `src/components/WatchViewer.tsx` | Вход Atelier, постоянный DOM/Canvas host, reducer, dialog lifecycle, передача selection/focus, стабильные callbacks, прежние инструменты Hero |
| `src/three/AionScene.tsx` | Выделены model/material policy и CameraDirector; renderer, свет, memo Environment, ContextGuard и Suspense сохранены |
| `src/three/types.ts` | Команды zoomIn/zoomOut в дополнение к существующим |
| `src/three/SceneDiagnostics.tsx` | Только DEV: material/resource/GLB-request/focus counters; opt-in кнопка проверки context loss |

### Созданы

| Файл | Назначение |
| --- | --- |
| `src/three/materialPolicy.ts` | Сохранённая политика Stage 3.2; клонирование без изменения кеша |
| `src/three/materialVariants.ts` | Typed IDs, точные node/material scopes и линейные PBR-значения |
| `src/three/materialRegistry.ts` | Локальный clone модели, normalization, валидация scopes, 13 owned materials, snapshots и apply/reset |
| `src/three/AionModel.tsx` | Один cached useGLTF, подготовка registry, применение selection и готовность |
| `src/three/cameraPresets.ts` | Full fit, точные bounds выбранных vertices, fit по обоим FOV, защитная геометрия камеры |
| `src/three/CameraDirector.tsx` | Единственный контроллер programmatic pose/target, переходов, ограничений и короткого движения |
| `src/atelier/AtelierState.ts` | React reducer: open, selection, focus, command version |
| `src/atelier/useAtelierDialog.ts` | Scroll lock, inert/aria-hidden соседей, focus trap, Escape, восстановление страницы |
| `src/atelier/AtelierControls.tsx` | Три native radio groups, mobile tabs, ракурсы, reset и указание на концепт |
| `src/atelier/atelier.css` | Локальные стили Atelier и небольшой вход в Hero |
| `scripts/check-atelier.mjs` | Проверки реального GLB/material ownership и математических ограничений камеры без нового test runner |
| `reports/stage5b/` | JSON/log проверок и локальные контрольные снимки |
| `STAGE5B_REPORT.md` | Этот отчёт |

`dist/` пересобран. `package.json` и `package-lock.json` не изменены. `App.tsx`, все `src/sections/*`, старые `src/styles/*`, `AdaptiveResolution.tsx` и `useSceneActivity.ts` не изменены.

## 3. Material variant implementation

### 3.1. Владение и безопасность

1. Loader один раз получает прежний URL `${BASE_URL}models/aion-v02.glb`.
2. `source.clone(true)` создаёт локальные Object3D, сохраняя ссылки на geometry/textures.
3. `cloneHardenedMaterial` применяет прежние настройки Stage 3.2 только к локальным материалам.
4. Registry проверяет **точное имя node, единственность совпадения, имя материала и отсутствие неожиданного массива material slots**.
5. M1 разделён на корпус/головку и исходные ступицу/фурнитуру. M0 разделён на BackRing и механизм. Итог — **13 рабочих материалов**, а не копия на каждый вариант/mesh.
6. Snapshot снят после hardening. `apply` сначала восстанавливает исходные color/metalness/roughness, затем синхронно применяет текущие IDs. Между этими операциями кадр не рисуется.
7. Меняются только color, metalness и roughness; maps, defines, side, transmission, UV, нормали, тангенты и geometry не меняются.
8. Cleanup освобождает только owned materials. Кеш geometry/textures не очищается при закрытии Atelier.

Невалидный scope делает соответствующую категорию unavailable. Применение такой настройки блокируется, а интерфейс сообщает о недоступности. Глобального выбора через startsWith/material.name с последующим изменением cached material нет.

### 3.2. Точные области изменения

| Категория | Объекты и материал |
| --- | --- |
| Case finish | `Case_Midbody`, `Case_FacetedBezel`, `Case_Static_CaseDarkSteel`, `Crown_KnurledBody`, `Crown_Static_CaseDarkSteel` / `Case_DarkSteel` |
| BackRing | Отдельная копия `Case_BackRing` / `Movement_Ruthenium`; следует выбору Case Finish |
| Strap | `Strap_LowerLeather`, `Strap_UpperLeather`, `Strap_Static_StrapBlackLeather` / `Strap_BlackLeather` |
| Gold | Все семь верифицированных node/use материала `Accent_ChampagneGold` из аудита |
| Brass | `Case_Static_MovementBrushedBrass`, `Dial_Static_MovementBrushedBrass`, `Rear_Static_MovementBrushedBrass` |

Gold scope: `Case_Static_AccentChampagneGold`, `Crown_Static_AccentChampagneGold`, `Dial_Static_AccentChampagneGold`, `Hands_Hour`, `Hands_Seconds`, `Hands_Static_AccentChampagneGold`, `Rear_Static_AccentChampagneGold`.

Вне Case scope остаются `Hands_Static_CaseDarkSteel`, `Strap_Static_CaseDarkSteel`, прочие Ruthenium meshes и полированные фаски. Не изменяются stitching, ruby, ivory, graphite и `Steel_PolishedEdge`, включая минутную стрелку. Metal Accents — общая палитра тёплых деталей; это не переключение каждого колеса или всех стрелок.

### 3.3. Пресеты

RGB в коде — **linear-sRGB**, не HEX/sRGB, без повторного преобразования исходных glTF-факторов.

| Категория / вариант | RGB linear | PBR |
| --- | --- | --- |
| Case / Original | Snapshot | Hardened исходные значения, включая отдельный Ruthenium BackRing |
| Obsidian Black | .018 / .023 / .030 | metalness 1, roughness .28 |
| Graphite Satin | .180 / .205 / .235 | metalness 1, roughness .39 |
| Strap / Original | Snapshot | Исходные maps, normalScale и roughness factor |
| Noir Leather | .0045 / .005 / .006 | metalness 0, исходная roughness map/factor |
| Ash Leather | .260 / .250 / .230 | metalness 0, те же карты/UV |
| Accents / Original | Snapshot двух материалов | Различие исходного золота и латуни сохранено |
| Champagne Gold / Gold | .630 / .470 / .250 | Исходные metalness и roughness |
| Champagne Gold / Brass | .400 / .315 / .180 | Исходные metalness и roughness |
| Silver / Gold | .600 / .640 / .700 | Исходные metalness и roughness |
| Silver / Brass | .360 / .400 / .460 | Исходные metalness и roughness |

Roughness Gold≈.30, Brass≈.40 сохраняется в обоих accent presets. Graphite Satin — изотропная визуальная интерпретация PBR, направленная шлифовка не симулируется. Ash/Noir используют одну исходную фактуру; новые сорта/текстуры кожи не заявляются.

### 3.4. Неизменяемые исправления

`Crystal_Sapphire`: transmission=1, opacity=1, transparent=false, roughness=.015, thickness=.012, ior=1.76, metalness=0, FrontSide, depthWrite/depthTest=true, specularIntensity=.12, envMapIntensity=.35. renderOrder не переопределён.

Анизотропия M0 без UV/tangent остаётся 0, включая отдельный BackRing. Ни один variant не включает anisotropy. Карты normal/roughness кожи, UV и tangent arrays сохраняются по ссылке. Reset восстанавливает web-hardened baseline, а не raw GLB.

## 4. Camera system architecture

`CameraDirector` заменил прежний Rig как единственный владелец programmatic camera/target. PerspectiveCamera остаётся FOV=31°, near=.1, far=60; OrbitControls без pan и damping, polar .4…2.7, rotateSpeed=.55. Zoom включается только в Atelier.

### Ракурсы

- **Full Watch:** прежний responsive fit по normalized radius/horizontalRadius; нижняя исходная дистанция 12.9, на узких Canvas увеличивается по aspect.
- **Dial Detail:** реальные world-transformed vertices выбранных Dial/Hands/Crystal_Front nodes.
- **Case & Crown:** корпус, безель и верифицированные Crown nodes, умеренный боковой взгляд.
- **Leather Strap:** `Strap_UpperLeather`, без попытки приблизить общий габарит двух ремешков.

Bounds рассчитываются после root/node transforms, rotateX=π/2, центрирования, масштаба до 6 единиц и внешнего Euler [.09,-.2,-.24]. Результат кешируется по экземпляру модели и focus. Центр не предполагается равным мировому нулю.

Fit учитывает горизонтальный и вертикальный FOV, глубину bounds и padding .86. У Dial в текущем наборе target≈[-.30451,.02855,1.23631]; отличается от предварительного набора аудита, поскольку включает переднее стекло.

Переход конечный, nominal animation time .85 s, smoothstep для позиции и target. Нет setState на каждый кадр. Во время tween старые zoom limits временно не зажимают стартовую позицию. Pointer interaction и команды вращения прерывают переход без возвращения в конечную точку; active=false приостанавливает обновления. Reduced motion применяет позу без tween.

Resize пересчитывает выбранный focus, а не возвращает полный вид. Return Full и закрытие восстанавливают корректный fit по текущему Canvas. Начальные/конечные размеры не берутся из window вместо измеренной области сцены.

### Ограничения и защита

Для каждого preset вычисляются min/max zoom distances. Дополнительно `protectCamera` использует сферу, содержащую **все вершины** модели, с запасом .3 единицы. Контроль учитывает не только расстояние камеры до сферы, но и положение **near plane** при смещённом target: вся защитная оболочка остаётся перед плоскостью с запасом. Ограничение применяется при переходах, кнопках и OrbitControls changes.

В Node sweep проверены 20 preset/aspect poses и **5760 orbit samples** на минимальном zoom; collision и near-plane assertions проходят. Это консервативное ограничение намеренно сокращает предельное приближение к отдельным деталям.

В focus-режимах часть длинного ремешка может выходить за кадр — это композиционное кадрирование close-up, не вход камеры внутрь модели или изменение стекла. Depth of field и post-processing не добавлены.

## 5. Atelier UI implementation

### Композиция

Полноэкранный CSS overlay раскрывает **существующий .watch-viewer**, не переносит Canvas в другой React parent и не меняет key. Нативный Fullscreen API не требуется.

Desktop: верхний CHRONOS/header с постоянным Return to Website; большой Canvas слева; справа editorial-панель с тремя группами и Focus Mode; снизу инструменты вращения/zoom. Панель при нехватке высоты прокручивается самостоятельно.

Tablet/mobile: Canvas над компактной панелью. Три категории переключаются доступными tabs, внутри — native radios; четыре ракурса и Reset остаются отдельными действиями. Учтены safe-area inset сверху/снизу и короткие landscape viewport. Touch targets не меньше 44 px.

В Hero добавлена только неброская кнопка **Atelier ↗**. Существующие Explore AION / RETURN TO AION по-прежнему возвращают к интерактивному Hero, как в Stage 4B. Отдельные секции/ссылки не перепроектировались.

### Жизненный цикл и доступность

- role=dialog, aria-modal, доступный заголовок.
- Фон исключается через inert/aria-hidden только на соседних ветвях; main/Hero ancestor не делается inert вместе с viewer.
- Escape закрывает; Tab/Shift+Tab удерживают фокус; после закрытия фокус возвращается к кнопке входа.
- Позиция страницы сохраняется **до commit fixed-размещения**, body блокируется с сохранением inline styles, затем scroll/focus/inert восстанавливаются.
- Native radio groups поддерживают клавиатуру; мобильные category tabs — стрелки, Home/End.
- Кнопки поворота/наклона/zoom доступны без мыши; viewer поддерживает стрелки, +/- и Home.
- Статусы загрузки и ошибки сообщаются через live region; фиктивных процентов нет.
- До готовности registry controls disabled. При context loss выход остаётся активным.
- Есть обозначение design concept и декоративного механизма; цены, availability и покупка отсутствуют.

## 6. Performance observations

Новых зависимостей нет. AdaptiveResolution сохранён побайтово: cap 1.5/2, ограничение device DPR и приблизительный бюджет 3 млн пикселей, прежнее снижение при устойчивых медленных кадрах. Demand-rendering, short Hero motion и однократный memo Environment resolution128/frames1 сохранены.

### Измерено во встроенном браузере

| Проверка | Результат |
| --- | --- |
| Все восемь ненулевых сочетаний при одинаковом full-ракурсе | 80 draw calls, 229 416 triangles |
| Owned materials | 13, число и UUID не меняются при выборе вариантов |
| Повторные открытия | Финальная серия 20: один model UUID, один Canvas |
| Loader request counter | Один resource entry GLB после 20 открытий, без роста |
| Renderer object counts | Постоянно 57 geometries / 7 textures / 12 programs |
| Idle в Atelier | 1714 → 1714 кадров за 47 364 ms |
| Retina, default viewport | device DPR2, renderer DPR2, CSS920×548, buffer1840×1096 |
| Близкий Dial на Retina | 78 calls: часть геометрии вне frustum; это не результат оптимизации вариантов |

Counts geometry/textures включают renderer/environment resources; это **не байты VRAM**. Один GLB request counter — число Resource Timing entries текущего документа, не инструментирование сетевого стека Safari.

В эмуляции пяти ширин browser viewport выставлял device DPR1, поэтому там buffer совпадал с CSS. Retina отдельно проверена после сброса override.

Сборка: main JS≈386.70 KB (gzip123.02), 3D chunk≈1038.15 KB (gzip287.58), CSS≈27.45 KB (gzip6.40). До Stage5B: main376.76 KB, 3D1032.62 KB, CSS19.41 KB. Ленивая загрузка 3D сохранена. Предупреждение Vite о чанке >750 KB осталось.

Максимальный FPS, GPU time, энергопотребление, температура и длительная нагрузка M1 **не измерялись**. Улучшение производительности не заявляется. Проверка счётчиков подтверждает отсутствие роста ресурсов в рассмотренной серии, а не доказательство отсутствия любой возможной утечки на всех устройствах.

## 7. Tests performed and results

### Gate A — Architecture: PASS

Исходная production-сборка прошла до изменений. Сделаны контрольные снимки; после выделения model/policy Hero визуально сохранён. Камера, свет, стекло и счетчики 80/229416 совпали.

Сравнение модели до/после на 1280×1000, одинаковой позиции страницы и камере, region [300,170,850,785]: 336 527 из338 250 pixels идентичны (≈99.49%); mean absolute RGB-channel difference≈.01091 из255, max14. Небольшие raster differences не используются для заявления полного попиксельного совпадения. Новая кнопка Atelier исключена из области модели.

### Gate B — Materials: PASS

`node scripts/check-atelier.mjs`:

- 41 mesh реального GLB разобран установленным GLTFLoader.
- Проверены все **27** сочетаний с Original, включая требуемые восемь сочетаний двух новых вариантов.
- 1000 быстрых применений selection; количество экземпляров постоянно.
- Cached materials остаются неизменными; geometry и texture refs совпадают.
- Вне scope материалы не изменяются; shader features / glass / maps сохраняются.
- Reset идемпотентен и возвращает hardened snapshot.
- Missing Case_Midbody → категория отключена, глобальная перекраска не выполняется.
- Dispose локальных материалов не вызывает dispose cached materials.

В Node image upload заменён Texture fixtures, поскольку нет browser image decoder. Geometry, node names, связи и типы материалов парсятся из настоящего GLB. Реальная загрузка карт и визуальная смена дополнительно проверены в браузере.

Диагностический скрипт выполнен на установленном Node 26.13.0 и использует registerHooks/native TypeScript. На старых версиях Node, включая 20.x, для запуска именно этого скрипта потребуется более новый Node; engine requirements самого Vite-приложения не менялись.

Восемь комбинаций и Original проверены в работающем Canvas. Швы, ступица, фурнитура, минутная стрелка, graphite/Ruthenium вне scope и стекло сравнивались с baseline. Два последовательных Reset дали равные snapshots.

### Gate C — Camera: PASS в доступном окружении

Проверены четыре preset на пяти ширинах, конечность перехода, ограниченный zoom, прерывание указателем и resize в ходе перехода с сохранением Case focus. На zoom min/max значения ограничены; камера вне защитной оболочки.

Встроенный браузер: pointer прервал Dial transition до конечной точки, transitioning=false. После перехода в полный вид idle frames не растут. Near/far и параметры стекла не менялись.

### Gate D — Interface: PASS в доступном окружении

| Viewport width | CSS Canvas | Layout | Горизонтальный overflow | Минимальный видимый control |
| ---: | --- | --- | ---: | --- |
| 1440 | 1080×728 | 2 колонки | 0 | 44×44 |
| 1280 | 920×728 | 2 колонки | 0 | 44×44 |
| 768 | 768×485 | Нижняя панель | 0 | 44×44 |
| 390 | 390×485 | Нижняя панель | 0 | 44×44 |
| 320 | 320×485 | Нижняя панель | 0 | 44×44 |

Высота теста: 900 px для desktop, 844 px для tablet/mobile. На всех размерах Return to Website оставался в viewport. Каждый размер проверен с четырьмя focus-режимами.

Проверены: category switching, ArrowRight по tabs, native radio selection, focus trap в обоих направлениях, Escape, возврат фокуса. Для ненулевой прокрутки вход/выход с клавиатуры дал **84→84 px**; inline body styles и inert сняты. Pointer automation перед нажатием сама центрирует элемент и может изменить исходную прокрутку, поэтому для этого сравнения использована клавиатура.

Проверена настоящая потеря контекста через WEBGL_lose_context в **явном DEV fault-test режиме**. Появилось сообщение «Interactive scene unavailable…», controls disabled, Return остался видимым и работал; после закрытия body/focus/inert восстановлены. Context restore без reload не реализован.

### Gate E — Final QA: PASS с перечисленными ограничениями

- `npm run typecheck`: PASS, также входит в финальный build.
- `npm run build`: PASS после последних изменений.
- Финальная production-сборка открыта в браузере: модель загружена, варианты/Case focus/Reset/Return работают, Canvas один.
- Console error/warn финального production-сеанса: **[]**.
- DEV diagnostics и fault-test markers отсутствуют в production JS.
- 20 open/close cycles после финальной правки scroll lifecycle: counters и model identity стабильны.
- Все шесть фотографий Stage4B загружены; отсутствующих #anchor targets нет.
- Anatomy Case→Strap, клавиатурное переключение, Collection Explore и Beyond Return проверены; возвращают к Hero и focus=watch-viewer.
- SHA-256 104 защищённых файлов совпадают: prototype, исходные/поставляемые ассеты, Stage4B-секции/стили, AdaptiveResolution, hook активности, package files и App. Удалённых исходных файлов нет.

В ходе пофайловой разработки был временный HMR failed reload, пока связанные новые модули ещё записывались. После финального reload и в production он не воспроизводится. Прежнее npm-предупреждение об env http-proxy и warning размера 3D chunk не устранялись изменением настроек пользователя.

### Настоящий Safari macOS

Через открытое приложение Safari проверены: вход в Atelier, Graphite Satin + Ash Leather + Silver, Case & Crown и Dial Detail, Reset, кнопочный поворот и Escape/возврат. Canvas отображает интерактивную модель, карты кожи читаются, прежние крупные чёрные блоки не наблюдались в этих видах.

Отдельная консоль Safari и GPU-профилировщик не использовались. Физические iOS/Android устройства, pinch жест двумя пальцами и screen reader не проверялись. Системная reduced-motion настройка не переключалась; её ветви реализованы и прочитаны, но отдельная OS-приёмка не заявляется.

## 8. Known limitations

1. Macro views показывают существующую декоративную геометрию, не физический калибр. Независимая настройка каждого колеса/моста/индекса не предусмотрена.
2. Graphite Satin не создаёт направленную brushed-фактуру; Ash Leather сохраняет исходную grain/normal/roughness структуру.
3. Консервативная camera envelope ограничивает экстремальное приближение. В close-up вне кадра могут оказаться части ремешка.
4. Панель на низком desktop viewport прокручивается; Return всегда закреплён сверху.
5. Safe-area/pinch и reduced-motion требуют финальной проверки на физических мобильных устройствах.
6. При потере контекста доступен выход и существующий reload retry Hero; бесшовного восстановления WebGL-контекста нет.
7. Сохранение дизайна между браузерными сессиями и экспорт конфигурации не реализованы; это не входило в Stage5B.
8. Длительное профилирование на M1 и реальные GPU/VRAM значения остаются задачами следующего этапа.

## 9. Regression findings

- Исходный GLB SHA-256: `7ee2284a4748efea207e46f46fd4941a4886dabb61b828fd98aaf23b8e3be3c7`; совпадает с public-моделью. Blender/PNG не менялись.
- Hero Original и исходный свет сохранены; единственное дополнение композиции — вход Atelier.
- Stage4B files, навигация, typography и transitions сохранены; проверенные CTA и Anatomy работают.
- Adaptive DPR и activity hook сохранены побайтово.
- После закрытия материалы Original, full framing, focus, scroll, body styles и доступность фона восстанавливаются.
- Непрерывного рендера в idle и роста renderer counters в проверенных циклах не обнаружено.
- Независимость настройками достигается локальными scopes, без изменения source/cache assets.

### QA evidence

В `reports/stage5b/`: `material-camera-checks.log`, `browser-materials.json`, `responsive-camera.json`, `zoom.json`, `lifecycle-final.json`, `model-requests.json`, `idle.json`, `retina.json`, `hero-comparison.json`, `console-production.json`; локальные снимки `hero-before.png`, `hero-gate-a.png`, `hero-after.png`, `atelier-1440/1280/768/390/320.png`, `atelier-production.png`.

Финальный screenshot показывает настоящую production-сцену с Graphite Satin / Ash Leather / Champagne Gold, не Blender-постер. Safari screenshots с посторонними вкладками использовались только для внутренней визуальной оценки и в комплект не сохранялись.

## 10. Recommendations for Stage 5C

1. Приёмка на настоящих iPhone/iPad/Android: pinch, safe-area, virtual viewport, поворот экрана, scroll restore и reduced motion.
2. Длительное профилирование M1/Safari: GPU/CPU, warmup, энергопотребление, fullscreen-resize и повторные открытия.
3. Screen reader/контраст/focus audit, отдельный сценарий context restore и локального retry без перезагрузки страницы.
4. Художественная калибровка палитр на согласованных дисплеях и макровидах; возможная правка доступных zoom limits по результатам мобильной приёмки.
5. Согласовать необходимость session sharing/export. Не добавлять без задачи корзину, цены или фиктивные продуктовые свойства.

**Stage5B завершён.** Конфигуратор, текущий сайт и доступные проверки готовы; публикация и Stage5C не выполнялись.
