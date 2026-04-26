import { getDefaultBlueprint } from "./defaultFormBlueprints";

export const buildTemplateCreatePayloadFromBlueprint = (professionKey) => {
  const blueprint = getDefaultBlueprint(professionKey);
  if (!blueprint) {
    return null;
  }
  return {
    profession_key: blueprint.professionKey,
    name: blueprint.name,
    description: blueprint.description,
    status: "active",
    locale: "en",
    email_subject: blueprint.emailSubject,
    email_body: blueprint.emailBody,
    schema: blueprint.schema,
    fields: blueprint.fields,
  };
};

export default {
  buildTemplateCreatePayloadFromBlueprint,
};
