const normaliseList = (list) => (Array.isArray(list) ? list : []);

export const toggleQuestionnaireSelection = (current, templateId) => {
  const list = normaliseList(current);
  const index = list.findIndex((item) => item?.template_id === templateId);
  if (index >= 0) {
    const next = list.slice();
    next.splice(index, 1);
    return next;
  }
  return [...list, { template_id: templateId, required: true }];
};

export const toggleQuestionnaireRequired = (current, templateId) => {
  const list = normaliseList(current);
  return list.map((item) =>
    item?.template_id === templateId
      ? { ...item, required: item.required === false ? true : !item.required }
      : item
  );
};

export const reorderQuestionnaireAssignments = (current, templateId, direction) => {
  const list = normaliseList(current);
  const index = list.findIndex((item) => item?.template_id === templateId);
  if (index === -1) {
    return list;
  }
  const offset = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  if (offset === 0) {
    return list;
  }
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }
  const next = list.slice();
  const [currentItem] = next.splice(index, 1);
  next.splice(targetIndex, 0, currentItem);
  return next;
};
