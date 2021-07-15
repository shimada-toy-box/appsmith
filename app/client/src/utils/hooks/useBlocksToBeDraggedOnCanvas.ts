import { useContext, useEffect, useRef } from "react";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { useSelector } from "store";
import { AppState } from "reducers";
import { getSelectedWidgets } from "selectors/ui";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { OccupiedSpace } from "constants/editorConstants";
import { getWidgets } from "sagas/selectors";
import {
  getDropZoneOffsets,
  widgetOperationParams,
} from "utils/WidgetPropsUtils";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { XYCoord } from "react-dnd";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { isEmpty } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasDraggingArena";

export type WidgetDraggingBlock = {
  left: number;
  top: number;
  width: number;
  height: number;
  columnWidth: number;
  rowHeight: number;
  widgetId: string;
  isNotColliding: boolean;
};

export const useBlocksToBeDraggedOnCanvas = ({
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: CanvasDraggingArenaProps) => {
  const containerPadding = noPad ? 0 : CONTAINER_GRID_PADDING;
  const dragDetails = useSelector(
    (state: AppState) => state.ui.widgetDragResize.dragDetails,
  );
  const defaultHandlePositions = {
    top: 20,
    left: 20,
  };
  const {
    draggingGroupCenter: dragCenter,
    dragGroupActualParent: dragParent,
    newWidget,
  } = dragDetails;
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const occupiedSpaces = useSelector(getOccupiedSpaces) || {};
  const isNewWidget = !!newWidget && !dragParent;
  const childrenOccupiedSpaces: OccupiedSpace[] =
    (dragParent && occupiedSpaces[dragParent]) || [];
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const allWidgets = useSelector(getWidgets);
  const getDragCenterSpace = () => {
    if (dragCenter && dragCenter.widgetId) {
      // Dragging by widget
      return (
        childrenOccupiedSpaces.find(
          (each) => each.id === dragCenter.widgetId,
        ) || {}
      );
    } else if (
      dragCenter &&
      Number.isInteger(dragCenter.top) &&
      Number.isInteger(dragCenter.left)
    ) {
      // Dragging by Widget selection box
      return dragCenter;
    } else {
      return {};
    }
  };
  const getBlocksToDraw = (): WidgetDraggingBlock[] => {
    if (isNewWidget) {
      return [
        {
          top: 0,
          left: 0,
          width: newWidget.columns * snapColumnSpace,
          height: newWidget.rows * snapRowSpace,
          columnWidth: newWidget.columns,
          rowHeight: newWidget.rows,
          widgetId: newWidget.widgetId,
          isNotColliding: true,
        },
      ];
    } else {
      return childrenOccupiedSpaces
        .filter((each) => selectedWidgets.includes(each.id))
        .map((each) => ({
          top: each.top * snapRowSpace + containerPadding,
          left: each.left * snapColumnSpace + containerPadding,
          width: (each.right - each.left) * snapColumnSpace,
          height: (each.bottom - each.top) * snapRowSpace,
          columnWidth: each.right - each.left,
          rowHeight: each.bottom - each.top,
          widgetId: each.id,
          isNotColliding: true,
        }));
    }
  };
  const blocksToDraw = getBlocksToDraw();
  const dragCenterSpace: any = getDragCenterSpace();

  const filteredChildOccupiedSpaces = childrenOccupiedSpaces.filter(
    (each) => !selectedWidgets.includes(each.id),
  );
  const { persistDropTargetRows, updateDropTargetRows } = useContext(
    DropTargetContext,
  );
  const { updateWidget } = useContext(EditorContext);

  const onDrop = (drawingBlocks: WidgetDraggingBlock[]) => {
    const cannotDrop = drawingBlocks.some((each) => {
      return !each.isNotColliding;
    });
    if (!cannotDrop) {
      drawingBlocks
        .sort(
          (each1, each2) =>
            each1.top + each1.height - (each2.top + each2.height),
        )
        .forEach((each) => {
          const widget = newWidget ? newWidget : allWidgets[each.widgetId];
          const updateWidgetParams = widgetOperationParams(
            widget,
            { x: each.left, y: each.top },
            { x: 0, y: 0 },
            snapColumnSpace,
            snapRowSpace,
            widget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : widgetId,
          );

          const widgetBottomRow =
            updateWidgetParams.payload.topRow +
            (updateWidgetParams.payload.rows ||
              widget.bottomRow - widget.topRow);
          persistDropTargetRows &&
            persistDropTargetRows(widget.widgetId, widgetBottomRow);

          /* Finally update the widget */
          updateWidget &&
            updateWidget(
              updateWidgetParams.operation,
              updateWidgetParams.widgetId,
              updateWidgetParams.payload,
            );
        });
    }
  };
  const updateRows = (drawingBlocks: WidgetDraggingBlock[], rows: number) => {
    if (drawingBlocks.length) {
      const sortedByTopBlocks = drawingBlocks.sort(
        (each1, each2) => each2.top + each2.height - (each1.top + each1.height),
      );
      const bottomMostBlock = sortedByTopBlocks[0];
      const [, top] = getDropZoneOffsets(
        snapColumnSpace,
        snapRowSpace,
        {
          x: bottomMostBlock.left,
          y: bottomMostBlock.top + bottomMostBlock.height,
        } as XYCoord,
        { x: 0, y: 0 },
      );
      if (top > rows - GridDefaults.CANVAS_EXTENSION_OFFSET) {
        return updateDropTargetRows && updateDropTargetRows(widgetId, top);
      }
    }
  };
  const rowRef = useRef(snapRows);
  useEffect(() => {
    rowRef.current = snapRows;
  }, [snapRows, isDragging]);

  const isChildOfCanvas = dragParent === widgetId;
  const parentDiff = isDragging
    ? {
        top:
          !isChildOfCanvas && !isEmpty(dragCenterSpace)
            ? dragCenterSpace.top * snapRowSpace + containerPadding
            : containerPadding,
        left:
          !isChildOfCanvas && !isEmpty(dragCenterSpace)
            ? dragCenterSpace.left * snapColumnSpace + containerPadding
            : containerPadding,
      }
    : {
        top: 0,
        left: 0,
      };

  const relativeStartPoints =
    isDragging && !isEmpty(dragCenterSpace)
      ? {
          left:
            ((isChildOfCanvas ? dragCenterSpace.left : 0) +
              dragDetails.dragOffset.left) *
              snapColumnSpace +
            2 * containerPadding,
          top:
            ((isChildOfCanvas ? dragCenterSpace.top : 0) +
              dragDetails.dragOffset.top) *
              snapRowSpace +
            2 * containerPadding,
        }
      : defaultHandlePositions;
  const currentOccSpaces = occupiedSpaces[widgetId];
  const occSpaces: OccupiedSpace[] = isChildOfCanvas
    ? filteredChildOccupiedSpaces
    : currentOccSpaces;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === widgetId;
  return {
    blocksToDraw,
    dragCenterSpace,
    dragDetails,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isResizing,
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    updateRows,
  };
};
