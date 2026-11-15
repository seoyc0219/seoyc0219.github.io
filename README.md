# MARGIN

개인 기술 블로그 스타터. 임시 이름과 예시 글을 사용합니다.

## GitHub Pages 배포
1. GitHub에서 `seoyc0219.github.io`라는 새 저장소를 만듭니다.
2. 이 프로젝트의 `dist` 폴더와 `.github/workflows/pages.yml`을 main 브랜치에 올립니다.
3. Settings → Pages → Source를 GitHub Actions로 설정합니다.
4. Actions에서 Deploy to GitHub Pages를 실행하면 `https://seoyc0219.github.io`로 배포됩니다.

## 수정
- 이름/소개: dist/index.html
- 예시 글 데이터: dist/app.js의 posts 배열
- 디자인: dist/style.css

현재는 빌드 과정이 없는 HTML/CSS/JS 구성입니다. 글은 posts 배열에 추가합니다. Markdown 자동 변환 기능은 포함하지 않습니다.

미리보기: `python3 -m http.server 8080 --directory dist`
외부 Google Fonts가 차단되어도 시스템 글꼴로 표시됩니다.
