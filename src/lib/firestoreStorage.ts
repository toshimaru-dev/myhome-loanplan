/**
 * Firestore クラウド同期ストレージ層（Sprint 5）
 *
 * 設計方針:
 * - ログイン不要・識別子不要。全利用者が単一の共有ドキュメント `shared/main` を参照する
 *   「共有ホワイトボード」型。端末側に同期コード等の識別子は一切保持しない。
 * - 物件データ本体はクラウド（Firestore）を正とし、`shared/main` ドキュメントの
 *   `properties` / `activeId` フィールドに状態を保存する。
 * - `onSnapshot` でリアルタイム購読し、他の利用者の編集を即座に反映する。
 * - 通信失敗してもアプリがクラッシュしないよう、購読開始を try/catch でガードする。
 * - ブラウザのローカルストレージには一切アクセスしない（Sprint 5 で完全廃止）。
 */
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { normalizeState, propertyNeedsMigration, type PersistState } from './storage';

/** 全利用者が共有する固定ドキュメントのコレクション名・ドキュメントID */
const SHARED_COLLECTION = 'shared';
const SHARED_DOC_ID = 'main';

/** 共有ドキュメントへの参照を返す（`shared/main`） */
function sharedDocRef() {
  return doc(db, SHARED_COLLECTION, SHARED_DOC_ID);
}

/**
 * 共有ドキュメント `shared/main` の状態をリアルタイム購読する。
 * @param onState ドキュメントが存在し有効なら PersistState と、Firestoreの生データに
 *   Sprint 6 以降のフィールドが欠けていたかどうか（needsMigration）を受け取る。
 *   needsMigration が true の場合、呼び出し側は正規化済みデータを Firestore に保存し直す。
 * @param onError 通信エラー時に呼ばれる（任意）
 * @returns 購読解除関数
 */
export function subscribeToState(
  onState: (state: PersistState | null, needsMigration?: boolean) => void,
  onError?: (error: unknown) => void
): () => void {
  try {
    const ref = sharedDocRef();
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          onState(null);
          return;
        }
        const rawData = snap.data();
        // Sprint 5: フィールドはドキュメント直下の { properties, activeId }。
        const normalized = normalizeState(rawData);
        // Sprint 6 以前のデータにはメタフィールド（url/memo/buildingAge/walkMinutes）が
        // ない場合がある。欠けていればマイグレーションが必要。
        const rawProps: unknown[] = Array.isArray(rawData?.properties)
          ? rawData.properties
          : [];
        const needsMigration = rawProps.some(propertyNeedsMigration);
        onState(normalized, needsMigration);
      },
      (err) => {
        // 通信エラーでもアプリは継続。呼び出し側へ通知のみ。
        onError?.(err);
      }
    );
  } catch (err) {
    // SDK 初期化失敗などでも購読開始でクラッシュさせない
    onError?.(err);
    return () => {};
  }
}

/**
 * 状態を共有ドキュメント `shared/main` に保存する。
 * 失敗時は reject されるので、呼び出し側で catch してオフライン表示等に使う。
 */
export async function saveStateToFirestore(state: PersistState): Promise<void> {
  const ref = sharedDocRef();
  // { properties, activeId } をドキュメント直下に保存する。
  // setDoc（merge なし）で常にドキュメント全体を最新状態に置き換える。
  await setDoc(ref, {
    properties: state.properties,
    activeId: state.activeId,
    updatedAt: Date.now(),
  });
}
