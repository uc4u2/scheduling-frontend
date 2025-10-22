const {
  toggleQuestionnaireSelection,
  toggleQuestionnaireRequired,
  reorderQuestionnaireAssignments,
} = require('../questionnaireAssignments');

describe('questionnaireAssignments helpers', () => {
  it('adds and removes questionnaires when toggled', () => {
    const base = [];
    const withOne = toggleQuestionnaireSelection(base, 5);
    expect(withOne).toEqual([{ template_id: 5, required: true }]);
    const without = toggleQuestionnaireSelection(withOne, 5);
    expect(without).toEqual([]);
  });

  it('defaults required flag to true when inserting', () => {
    const result = toggleQuestionnaireSelection([{ template_id: 3, required: false }], 7);
    expect(result).toEqual([
      { template_id: 3, required: false },
      { template_id: 7, required: true },
    ]);
  });

  it('toggles the required flag for an existing entry', () => {
    const list = [
      { template_id: 9, required: true },
      { template_id: 2, required: false },
    ];
    const toggled = toggleQuestionnaireRequired(list, 2);
    expect(toggled).toEqual([
      { template_id: 9, required: true },
      { template_id: 2, required: true },
    ]);
  });

  it('reorders questionnaires within bounds', () => {
    const list = [
      { template_id: 1, required: true },
      { template_id: 2, required: true },
      { template_id: 3, required: true },
    ];
    const movedUp = reorderQuestionnaireAssignments(list, 2, 'up');
    expect(movedUp.map((item) => item.template_id)).toEqual([2, 1, 3]);
    const movedDown = reorderQuestionnaireAssignments(movedUp, 2, 'down');
    expect(movedDown.map((item) => item.template_id)).toEqual([1, 2, 3]);
  });
});
