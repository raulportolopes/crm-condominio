# Como publicar o CRM

O projeto é um site estático (HTML, CSS e JavaScript). Não tem build nem banco de dados, então dá para publicar de graça em qualquer um dos caminhos abaixo. **Recomendado: Vercel.**

---

## Opção 1: Vercel (recomendado, grátis, atualiza sozinho)

1. Acesse **https://vercel.com** e clique em **Sign Up** → **Continue with GitHub**.
2. No painel, clique em **Add New… → Project**.
3. Na lista, encontre **raulportolopes/crm-condominio** e clique em **Import**.
   - Se o repositório não aparecer, clique em **Adjust GitHub App Permissions** e libere o acesso a ele.
4. Na tela de configuração:
   - **Framework Preset:** `Other`
   - **Root Directory:** deixe `./`
   - **Build Command** e **Output Directory:** deixe em branco
5. Clique em **Deploy**. Em cerca de 30 segundos o site fica no ar num endereço como `https://crm-condominio.vercel.app`.
6. Prévia lado a lado (computador + celular): `https://SEU-ENDERECO.vercel.app/preview.html`

A cada novo commit no GitHub, a Vercel publica a nova versão sozinha.

**Domínio próprio (opcional):** no projeto da Vercel, vá em **Settings → Domains**, digite o domínio (ex.: `crm.seudominio.com.br`) e siga as instruções de DNS que ela mostrar.

---

## Opção 2: GitHub Pages (grátis, sem criar outra conta)

1. Abra **https://github.com/raulportolopes/crm-condominio**.
2. Vá em **Settings → Pages**.
3. Em **Source**, escolha **Deploy from a branch**.
4. Em **Branch**, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
5. Aguarde 1 a 2 minutos e recarregue a página. O endereço aparece no topo:
   `https://raulportolopes.github.io/crm-condominio/`

> Observação: em conta gratuita, o GitHub Pages só funciona com repositório **público**. Se o repositório for privado, use a Vercel ou a Netlify.

---

## Opção 3: Netlify (arrastar e soltar)

1. Acesse **https://app.netlify.com** e entre com o GitHub.
2. **Add new site → Import an existing project → GitHub** e escolha `crm-condominio`.
3. Deixe **Build command** vazio e **Publish directory** como `.`. Clique em **Deploy**.

Para testar sem o GitHub: **Add new site → Deploy manually** e arraste a pasta do projeto.

---

## Opção 4: HostGator ou outra hospedagem com cPanel

1. Baixe o projeto: no GitHub, clique em **Code → Download ZIP**.
2. No cPanel, abra o **Gerenciador de Arquivos** e entre em `public_html` (ou numa subpasta, ex.: `public_html/crm`).
3. Clique em **Carregar**, envie o ZIP e depois use **Extrair**.
4. Garanta que o `index.html` ficou direto dentro da pasta (e não numa subpasta `crm-condominio-main`). Se ficou, mova os arquivos um nível acima.
5. Acesse `https://seudominio.com.br` (ou `/crm`).

---

## Testar no seu computador antes de publicar

Os módulos JavaScript não abrem com duplo clique no `index.html`. Use um servidor local:

```bash
# na pasta do projeto
python3 -m http.server 8080
# abra http://localhost:8080  (e http://localhost:8080/preview.html para a prévia)
```

Sem Python, você pode usar a extensão **Live Server** do VS Code (botão "Go Live").

---

## Atualizar o site depois

- **Pelo navegador:** no GitHub, abra o arquivo, clique no lápis ✏️, edite e clique em **Commit changes**. A Vercel ou a Netlify publicam sozinhas. No GitHub Pages leva cerca de 1 minuto.
- **Pelo computador:**
  ```bash
  git clone https://github.com/raulportolopes/crm-condominio
  cd crm-condominio
  # edite os arquivos
  git add .
  git commit -m "Minha alteração"
  git push
  ```

## O que personalizar

| O quê | Onde |
|---|---|
| Nome do condomínio, incorporadora, síndica, endereço | `js/data.js` → `CONFIG` |
| Número de torres, andares e apartamentos por andar | `js/data.js` → `CONFIG.torres` |
| Valor da cota, multa e juros | `js/data.js` → `CONFIG` |
| Plantas (ambientes, áreas, quartos) | `js/data.js` → `PLANTAS` |
| Planta 3D própria (.glb) | pasta `plantas/` + campo `modelo3d` (veja `plantas/LEIA-ME.txt`) |
| Fachada (cores, materiais, proporções) | `js/building3d.js` (constantes no topo e `const M`) |

> Os dados atuais são de demonstração e ficam salvos só no navegador de quem usa. Para uso real com vários usuários, o próximo passo é ligar um banco de dados com login (ex.: Supabase ou Firebase).
