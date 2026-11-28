// The portrait ID survives renaming, including in older saves.
const townResidentSheets = new Map([['ルイ', __RUI_SHEET__]]);
function townResidentSheet(person) {
  return townResidentSheets.get(citizenPortraitName(person));
}
