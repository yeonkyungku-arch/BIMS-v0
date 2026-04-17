import { redirect } from 'next/navigation';

// /registry/assets/list는 통합 페이지(/registry/assets)로 대체되었습니다.
export default function AssetListRedirectPage() {
  redirect('/registry/assets');
}
