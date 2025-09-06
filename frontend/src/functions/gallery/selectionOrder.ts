import { MARKER } from './addImageDataToGallery.ts';

const gallery = document.getElementById("gallery") as HTMLDivElement;

export const sortBySelectionOrder = (maxIndex: string) => (a: HTMLDivElement, b: HTMLDivElement) => {
  const orderA = parseInt(a.dataset.order || maxIndex, 10);
  const orderB = parseInt(b.dataset.order || maxIndex, 10);

  if (orderA < orderB) {
    return -1;
  }

  if (orderA > orderB) {
    return 1;
  }

  return 0;
};

export const updateSelectionOrder = (lastSelectedNode?: HTMLDivElement) => {
  const unSelectedItems = [...gallery.querySelectorAll(`.gallery-image:not(.${MARKER})`)] as HTMLDivElement[];
  let selectedItems = [...gallery.querySelectorAll(`.${MARKER}`)] as HTMLDivElement[];

  for (const unSelectedItem of unSelectedItems) {
    unSelectedItem.dataset.order = '';
  }

  const maxIndex = (selectedItems.length + unSelectedItems.length + 1).toString(10);

  if (lastSelectedNode && selectedItems.includes(lastSelectedNode)) {
    lastSelectedNode.dataset.order = maxIndex;
  }

  selectedItems.sort(sortBySelectionOrder(maxIndex));

  for (const [idx, selectedItem] of Object.entries(selectedItems)) {
    const index = parseInt(idx, 10);
    selectedItem.dataset.order = (index + 1).toString(10);
  }
}
