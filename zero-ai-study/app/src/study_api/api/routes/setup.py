from fastapi import APIRouter, Query

from study_api.core.schemas import (
    ActionResult,
    ActivityItem,
    ConceptsNotes,
    DatasetResponse,
    DatasetSaveRequest,
    DataCraftChecklist,
    DataCraftConfirmRequest,
    EngineeringChecklist,
    EngineeringConfirmRequest,
    EvalChecklist,
    EvalConfirmRequest,
    ExportChecklist,
    ExportConfirmRequest,
    FinetuneChecklist,
    FinetuneConfirmRequest,
    HparamsChecklist,
    HparamsConfirmRequest,
    KaggleConfirmRequest,
    KaggleSetupStatus,
    RetrainChecklist,
    RetrainConfirmRequest,
    TokenSaveRequest,
    TokenStatus,
    TokenTestRequest,
    TokenTestResult,
)
from study_api.services import (
    activity_service,
    concepts_service,
    data_craft_service,
    dataset_service,
    engineering_service,
    eval_service,
    export_service,
    finetune_service,
    hparams_service,
    kaggle_service,
    retrain_service,
    token_service,
)

router = APIRouter(tags=["setup"])


@router.get("/setup/token-status", response_model=TokenStatus)
def token_status():
    return token_service.get_token_status()


@router.post("/setup/save-token", response_model=ActionResult)
def save_token(body: TokenSaveRequest):
    return token_service.save_token(body.token)


@router.post("/setup/test-token", response_model=TokenTestResult)
def test_token(body: TokenTestRequest = TokenTestRequest()):
    return token_service.test_token(body.token)


@router.get("/setup/kaggle-status", response_model=KaggleSetupStatus)
def kaggle_status():
    return kaggle_service.get_status()


@router.post("/setup/kaggle-confirm", response_model=ActionResult)
def kaggle_confirm(body: KaggleConfirmRequest):
    return kaggle_service.save_status(body)


@router.get("/concepts/notes", response_model=ConceptsNotes)
def get_concepts_notes():
    return concepts_service.get_notes()


@router.post("/concepts/notes", response_model=ActionResult)
def save_concepts_notes(body: ConceptsNotes):
    return concepts_service.save_notes(body)


@router.get("/dataset", response_model=DatasetResponse)
def get_dataset():
    return dataset_service.load_dataset()


@router.post("/dataset", response_model=ActionResult)
def save_dataset(body: DatasetSaveRequest):
    return dataset_service.save_dataset(body)


@router.get("/activity", response_model=list[ActivityItem])
def activity(limit: int = Query(default=40, ge=1, le=200)):
    return activity_service.list_activity(limit=limit)


@router.get("/finetune/checklist", response_model=FinetuneChecklist)
def get_finetune_checklist():
    return finetune_service.get_checklist()


@router.post("/finetune/confirm", response_model=ActionResult)
def confirm_finetune(body: FinetuneConfirmRequest):
    return finetune_service.save_checklist(body)


@router.post("/finetune/validate", response_model=ActionResult)
def validate_finetune(body: FinetuneConfirmRequest):
    return finetune_service.validate_checklist(body)


@router.get("/eval/checklist", response_model=EvalChecklist)
def get_eval_checklist():
    return eval_service.get_checklist()


@router.post("/eval/confirm", response_model=ActionResult)
def confirm_eval(body: EvalConfirmRequest):
    return eval_service.save_checklist(body)


@router.post("/eval/validate", response_model=ActionResult)
def validate_eval(body: EvalConfirmRequest):
    return eval_service.validate_checklist(body)


@router.get("/export/checklist", response_model=ExportChecklist)
def get_export_checklist():
    return export_service.get_checklist()


@router.post("/export/confirm", response_model=ActionResult)
def confirm_export(body: ExportConfirmRequest):
    return export_service.save_checklist(body)


@router.post("/export/validate", response_model=ActionResult)
def validate_export(body: ExportConfirmRequest):
    return export_service.validate_checklist(body)


@router.get("/data-craft/checklist", response_model=DataCraftChecklist)
def get_data_craft_checklist():
    return data_craft_service.get_checklist()


@router.post("/data-craft/confirm", response_model=ActionResult)
def confirm_data_craft(body: DataCraftConfirmRequest):
    return data_craft_service.save_checklist(body)


@router.post("/data-craft/validate", response_model=ActionResult)
def validate_data_craft(body: DataCraftConfirmRequest):
    return data_craft_service.validate_checklist(body)


@router.get("/hparams/checklist", response_model=HparamsChecklist)
def get_hparams_checklist():
    return hparams_service.get_checklist()


@router.post("/hparams/confirm", response_model=ActionResult)
def confirm_hparams(body: HparamsConfirmRequest):
    return hparams_service.save_checklist(body)


@router.post("/hparams/validate", response_model=ActionResult)
def validate_hparams(body: HparamsConfirmRequest):
    return hparams_service.validate_checklist(body)


@router.get("/retrain/checklist", response_model=RetrainChecklist)
def get_retrain_checklist():
    return retrain_service.get_checklist()


@router.post("/retrain/confirm", response_model=ActionResult)
def confirm_retrain(body: RetrainConfirmRequest):
    return retrain_service.save_checklist(body)


@router.post("/retrain/validate", response_model=ActionResult)
def validate_retrain(body: RetrainConfirmRequest):
    return retrain_service.validate_checklist(body)


@router.get("/engineering/checklist", response_model=EngineeringChecklist)
def get_engineering_checklist():
    return engineering_service.get_checklist()


@router.post("/engineering/confirm", response_model=ActionResult)
def confirm_engineering(body: EngineeringConfirmRequest):
    return engineering_service.save_checklist(body)


@router.post("/engineering/validate", response_model=ActionResult)
def validate_engineering(body: EngineeringConfirmRequest):
    return engineering_service.validate_checklist(body)
