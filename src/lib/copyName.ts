// src/lib/copyName.ts
//
// Save As 時のコピー名生成ロジック。
// baseName と既存名一覧から次の連番コピー名を返す純粋関数。

/**
 * baseName の末尾に連番サフィックスを付けた次のコピー名を返す。
 *
 * 例:
 *   nextCopyName("HR管理", [])                          → "HR管理 001"
 *   nextCopyName("HR管理", ["HR管理 001"])               → "HR管理 002"
 *   nextCopyName("HR管理", ["HR管理 001", "HR管理 003"]) → "HR管理 004"
 */
export function nextCopyName(baseName: string, existingNames: string[]): string {
    // "baseName 001" 形式に完全一致するパターン（部分一致を避けるため ^ と $ を使う）
    const pattern = new RegExp(`^${escapeRegExp(baseName)} (\\d{3})$`);

    const nums = existingNames
        .map(name => pattern.exec(name)?.[1])
        .filter((n): n is string => n !== undefined)
        .map(Number);

    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${baseName} ${String(next).padStart(3, '0')}`;
}

// RegExp の特殊文字をエスケープする
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}