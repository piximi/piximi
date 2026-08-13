import { Fragment, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import {
  Box,
  List,
  ListItemButton,
  Checkbox,
  Chip,
  Collapse,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import GestureIcon from "@mui/icons-material/Gesture";
import { Label as CategoryIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs";

import { selectSelectedCategory } from "@ImageViewer/state/image-viewer-data/selectors";
import { generateCategory, generateKind } from "store/data/utils";
import { dataSliceV2 } from "store/data";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";

import { representsUnknown } from "utils/stringUtils";
import { getCategoryIconStyle } from "utils/styleUtils";
import { HotkeyContext } from "utils/enums";

import { TaxonomyDialog } from "./TaxonomyDialogForm";
import { useCriterionToggles } from "./useCriterionToggles";

import type { CategoryNode } from "@ImageViewer/state/types";
import type { EntityType, KindNode, TaxonomyDialogRequest } from "./types";

const CountChip = ({ n }: { n: number }) => (
  <Chip
    label={n}
    size="small"
    sx={(theme) => ({
      height: 18,
      bgcolor: theme.palette.action.selected,
      color: "text.secondary",
      fontSize: "0.675rem",
      fontWeight: 500,
    })}
  />
);

interface MenuState {
  anchor: HTMLElement;
  type: EntityType;
  kindId: string;
  catId: string | null;
}

interface AnnotationTreeProps {
  groups: KindNode[];
  hiddenCount: number;
  header: React.ReactNode;
}

/**
 * Kind → category tree. Checkboxes select categories directly (that
 * selection is the source both for "Create Filter" and for Delete/Export).
 * Each row has a kebab menu for CRUD; "Add category"/"Add Kind" rows too.
 *
 * Props: groups, hiddenCount, header (ReactNode)
 */
export const CategoryTree = ({
  groups,
  hiddenCount,
  header,
}: AnnotationTreeProps) => {
  const dispatch = useDispatch();
  const { toggleCategories } = useCriterionToggles();
  const theme = useTheme();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dialog, setDialog] = useState<TaxonomyDialogRequest | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const selectedCategory = useSelector(selectSelectedCategory);

  const {
    onOpen: openDeleteConfirm,
    onClose: closeDeleteConfirm,
    open: deleteConfirmOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleToggleExpand = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const close = () => setMenu(null);
  const openMenu = (
    e: React.MouseEvent<HTMLElement>,
    type: EntityType,
    kindId: string,
    catId: string | null,
  ) => {
    e.stopPropagation();
    setMenu({ anchor: e.currentTarget, type, kindId, catId });
  };

  // ---- cat/kind filters ----
  const handleToggleKind = (k: KindNode) =>
    toggleCategories(
      k.cats.map((c) => c.id),
      !k.allSel,
    );
  const handleToggleCat = (c: CategoryNode) => toggleCategories([c.id], !c.sel);
  const handleSelectCat = (c: CategoryNode) =>
    dispatch(imageViewerDataSlice.actions.setSelectedCategory(c));

  // ---- CRUD ----
  const handleOpenEdit = (
    kind: EntityType,
    kindId: string,
    catId: string | null,
  ) => {
    const k = groups.find((g) => g.id === kindId);
    if (!k) return;
    if (kind === "kind") {
      setDialog({
        mode: "edit",
        type: kind,
        kindId,
        name: k.name,
        existingNames: groups.map((g) => g.name),
      });
    } else {
      const c = k.cats.find((x) => x.id === catId)!;
      setDialog({
        mode: "edit",
        type: kind,
        kindId,
        catId: catId!,
        name: c.name,
        color: c.color,
        existingNames: k.cats.map((c) => c.name),
      });
    }
  };
  const handleAddKind = () =>
    setDialog({
      mode: "create",
      type: "kind",
      name: "",
      existingNames: groups.map((g) => g.name),
    });
  const handleAddCat = (kindId: string) => {
    const k = groups.find((g) => g.id === kindId);
    if (!k) return;
    setDialog({
      mode: "create",
      type: "cat",
      kindId,
      name: "",
      existingNames: k.cats.map((c) => c.name),
    });
  };

  const handleSaveDialog = (name: string, color?: string) => {
    const d = dialog;
    if (!d) return;
    if (d.mode === "create") {
      if (d.type === "kind") {
        const { kind, unknownCategory } = generateKind(name);
        dispatch(
          dataSliceV2.actions.addKind({
            kind: kind,
            category: unknownCategory,
          }),
        );
      } else {
        const category = generateCategory(name, color!, {
          type: "annotation",
          kindId: d.kindId!,
        });
        dispatch(dataSliceV2.actions.addCategory(category));
      }
    } else {
      if (d.type === "kind") {
        dispatch(
          dataSliceV2.actions.updateKindName({ kindId: d.kindId!, name }),
        );
      } else {
        dispatch(
          dataSliceV2.actions.updateCategoryDisplayProps({
            id: d.catId!,
            changes: { name, color },
          }),
        );
        if (selectedCategory.id === d.catId)
          dispatch(
            imageViewerDataSlice.actions.setSelectedCategory({
              ...selectedCategory,
              name,
              color: color ?? selectedCategory.color,
            }),
          );
      }
    }

    setDialog(null);
  };

  const handleDeleteEntity = () => {
    if (!menu) return;
    const { type, kindId, catId } = menu;
    const k = groups.find((k) => k.id === kindId);
    if (!k) return;
    if (type === "kind") {
      const catIds = k ? k.cats.map((c) => c.id) : [];
      if (representsUnknown(k.id)) return;
      const unknownK = groups.find((k) => representsUnknown(k.id))!;
      batch(() => {
        dispatch(dataSliceV2.actions.deleteKind(kindId));
        dispatch(
          imageViewerDataSlice.actions.toggleCatSelection({
            ids: catIds,
            on: false,
          }),
        );
        if (catIds.includes(selectedCategory.id))
          dispatch(
            imageViewerDataSlice.actions.setSelectedCategory(
              unknownK.cats.find((c) => representsUnknown(c.id))!,
            ),
          );
      });
    } else {
      if (representsUnknown(catId!)) return;
      batch(() => {
        dispatch(
          dataSliceV2.actions.deleteCategory({
            id: catId!,
            details: { type: "annotation", kindId },
          }),
        );
        dispatch(
          imageViewerDataSlice.actions.toggleCatSelection({
            ids: [catId!],
            on: false,
          }),
        );
        if (selectedCategory.id === catId)
          dispatch(
            imageViewerDataSlice.actions.setSelectedCategory(
              k.cats.find((c) => representsUnknown(c.id))!,
            ),
          );
      });
    }
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {header}
      <List
        disablePadding
        sx={{
          "& .MuiListItemButton-root": {
            borderRadius: 0,
          },
        }}
      >
        {groups.map((k) => (
          <Fragment key={k.id}>
            <ListItemButton
              sx={{
                height: 34,
                pl: 0.5,
                pr: 1,
                "&:hover .kebab": { opacity: 1 },
              }}
              selected={k.id === selectedCategory.kindId}
              onClick={() => handleToggleExpand(k.id)}
            >
              {expanded[k.id] ? (
                <ExpandMoreIcon sx={{ fontSize: 20, color: "action.active" }} />
              ) : (
                <ChevronRightIcon
                  sx={{ fontSize: 20, color: "action.active" }}
                />
              )}
              <Checkbox
                size="small"
                disableRipple
                checked={k.allSel}
                indeterminate={k.someSel}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleKind(k);
                }}
                sx={{ p: 0, mx: 0.5 }}
              />
              <Box sx={{ display: "flex", flex: 1, alignItems: "center" }}>
                <Typography
                  noWrap
                  sx={{ fontSize: "0.75rem", fontWeight: 500, mr: 1 }}
                >
                  {k.name}
                </Typography>
                {k.id === selectedCategory.kindId && (
                  <GestureIcon color="primary" sx={{ fontSize: 16 }} />
                )}
              </Box>
              <CountChip n={k.count} />
              <IconButton
                className="kebab"
                size="small"
                sx={{ opacity: 0, ml: 0.25 }}
                onClick={(e) => openMenu(e, "kind", k.id, null)}
              >
                <MoreVertIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </ListItemButton>

            <Collapse in={!!expanded[k.id]} unmountOnExit>
              {k.cats.map((c) => (
                <ListItemButton
                  key={c.id}
                  onClick={() => handleSelectCat(c)}
                  selected={c.id === selectedCategory.id}
                  sx={{
                    height: 30,
                    pl: 5,
                    pr: 1,
                    bgcolor: c.sel ? "rgba(25,118,210,.08)" : "transparent",
                    "&:hover .kebab": { opacity: 1 },
                  }}
                >
                  <Checkbox
                    size="small"
                    disableRipple
                    checked={c.sel}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCat(c);
                    }}
                    sx={{ p: 0, mr: 1.25 }}
                  />
                  <CategoryIcon
                    sx={{
                      ...getCategoryIconStyle(theme, c.color),
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flex: "none",
                      mr: 1.25,
                    }}
                  />
                  <Box sx={{ display: "flex", flex: 1, alignItems: "center" }}>
                    <Typography noWrap sx={{ fontSize: "0.75rem", mr: 1 }}>
                      {c.name}
                    </Typography>
                    {c.id === selectedCategory.id && (
                      <GestureIcon
                        color="primary"
                        sx={{ fontSize: "0.875rem" }}
                      />
                    )}
                  </Box>
                  <CountChip n={c.count} />
                  <IconButton
                    className="kebab"
                    size="small"
                    sx={{ opacity: 0, ml: 0.25 }}
                    onClick={(e) => openMenu(e, "cat", k.id, c.id)}
                  >
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItemButton>
              ))}
              <ListItemButton
                onClick={() => handleAddCat(k.id)}
                sx={{ height: 34, pl: 5, color: "primary.main" }}
              >
                <AddIcon sx={{ fontSize: 18, mr: 1 }} />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                  Add category
                </Typography>
              </ListItemButton>
            </Collapse>
          </Fragment>
        ))}

        <ListItemButton
          onClick={handleAddKind}
          sx={{ height: 34, px: 2, color: "primary.main" }}
        >
          <AddIcon sx={{ fontSize: 18, mr: 1 }} />
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
            Add Kind
          </Typography>
        </ListItemButton>
      </List>

      {hiddenCount > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.5,
            color: "text.disabled",
          }}
        >
          <FilterAltOffIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 11.5 }}>
            {hiddenCount} {hiddenCount === 1 ? "kind has" : "kinds have"} none
            in view
          </Typography>
        </Box>
      )}

      <Menu
        anchorEl={menu?.anchor}
        open={!!menu}
        onClose={close}
        sx={{
          "& .MuiMenuItem-root": {
            fontSize: "0.75rem",
            minHeight: 20,
            px: 1,
          },
        }}
      >
        {menu && !(!menu.catId && representsUnknown(menu.kindId)) && (
          <MenuItem
            dense
            onClick={() => {
              handleOpenEdit(menu!.type, menu!.kindId, menu!.catId);
              close();
            }}
          >
            <EditIcon
              sx={{ fontSize: "0.75rem", mr: 1, color: "action.active" }}
            />
            Edit
          </MenuItem>
        )}
        {menu?.type === "kind" && (
          <MenuItem
            dense
            onClick={() => {
              handleAddCat(menu!.kindId);
              close();
            }}
          >
            <AddIcon
              sx={{ fontSize: "0.75rem", mr: 1, color: "action.active" }}
            />
            Add category
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          sx={{ color: "error.main" }}
          dense
          onClick={() => {
            openDeleteConfirm();
          }}
        >
          <DeleteIcon sx={{ fontSize: "0.75rem", mr: 1 }} /> Delete{" "}
          {menu?.type === "kind" ? "kind" : "category"}
        </MenuItem>
      </Menu>
      <TaxonomyDialog
        request={dialog}
        onClose={() => setDialog(null)}
        onSave={handleSaveDialog}
      />
      {menu && (
        <ConfirmationDialog
          title={`Delete ${menu!.type === "kind" ? "Kind" : "Category"}`}
          content={`Annotations of this ${menu!.type === "kind" ? "kind" : "category"} will be reassigned to "Unknown"`}
          onConfirm={handleDeleteEntity}
          onClose={() => {
            closeDeleteConfirm();
            close();
          }}
          isOpen={deleteConfirmOpen}
        />
      )}
    </Box>
  );
};
