import api from "../utils/api";

export const downloadTeamMemberImportTemplate = () =>
  api.get("/manager/recruiters/imports/templates/team-members", {
    responseType: "blob",
  });

export const previewTeamMemberImport = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/manager/recruiters/imports/team-members/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const commitTeamMemberImport = (file, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("confirm_authority", options.confirmAuthority ? "true" : "false");
  return api
    .post("/manager/recruiters/imports/team-members/commit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const listTeamMemberImportHistory = () =>
  api.get("/manager/recruiters/imports/history", {
    params: { type: "team_members" },
  }).then((res) => res.data || { items: [] });
