const gallery = document.getElementById("gallery");
const deleteSelectedBtn = document.getElementById("delete_selected_btn");
const averageSelectedBtn = document.getElementById("average_selected_btn");
const selectAllBtn = document.getElementById("select_all_btn");
export const updateButtons = () => {
    const hasSelectedItems = document.querySelectorAll('.marked-for-action').length;
    selectAllBtn.disabled = !gallery.children.length;
    deleteSelectedBtn.disabled = !hasSelectedItems;
    averageSelectedBtn.disabled = !hasSelectedItems;
};
