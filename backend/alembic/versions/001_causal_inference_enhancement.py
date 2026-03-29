"""
Alembic数据库迁移脚本 - Phase 1增强字段
创建时间: 2026-03-29
说明: 为SaveMyself添加因果推断所需的增强字段
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_causal_inference_enhancement'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """添加因果推断增强字段"""

    # ===== 增强 savemyself_users 表 =====
    op.add_column('savemyself_users',
        sa.Column('rhinitis_type', sa.String(50), nullable=True,
                  comment='鼻炎类型: 季节性/常年性/混合型'))
    op.add_column('savemyself_users',
        sa.Column('diagnosed_date', sa.Date(), nullable=True,
                  comment='确诊日期'))
    op.add_column('savemyself_users',
        sa.Column('family_history', sa.Boolean(), default=False,
                  comment='家族过敏史'))
    op.add_column('savemyself_users',
        sa.Column('has_asthma', sa.Boolean(), default=False,
                  comment='是否合并哮喘'))
    op.add_column('savemyself_users',
        sa.Column('has_eczema', sa.Boolean(), default=False,
                  comment='是否合并湿疹'))
    op.add_column('savemyself_users',
        sa.Column('has_conjunctivitis', sa.Boolean(), default=False,
                  comment='是否合并结膜炎'))
    op.add_column('savemyself_users',
        sa.Column('known_allergens', sa.Text(), nullable=True,
                  comment='已知过敏原(JSON格式)'))
    op.add_column('savemyself_users',
        sa.Column('occupation', sa.String(100), nullable=True,
                  comment='职业'))
    op.add_column('savemyself_users',
        sa.Column('smoking_status', sa.String(20), nullable=True,
                  comment='吸烟状态: 从不/曾经/当前'))
    op.add_column('savemyself_users',
        sa.Column('residence_type', sa.String(20), nullable=True,
                  comment='居住类型: 城市/郊区/农村'))

    # ===== 增强 savemyself_daily_logs 表 =====
    # 环境污染物详细
    op.add_column('savemyself_daily_logs',
        sa.Column('pm25', sa.Float(), nullable=True, comment='PM2.5浓度(μg/m³)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('pm10', sa.Float(), nullable=True, comment='PM10浓度(μg/m³)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('no2', sa.Float(), nullable=True, comment='NO₂浓度(μg/m³)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('o3', sa.Float(), nullable=True, comment='O₃浓度(μg/m³)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('co', sa.Float(), nullable=True, comment='CO浓度(mg/m³)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('so2', sa.Float(), nullable=True, comment='SO₂浓度(μg/m³)'))

    # 气象详细
    op.add_column('savemyself_daily_logs',
        sa.Column('precipitation', sa.Float(), nullable=True, comment='降雨量(mm)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('pressure', sa.Float(), nullable=True, comment='气压(hPa)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('wind_speed', sa.Float(), nullable=True, comment='风速(m/s)'))

    # 过敏原详细
    op.add_column('savemyself_daily_logs',
        sa.Column('pollen_count', sa.Integer(), nullable=True, comment='花粉浓度(粒/m³)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('pollen_type', sa.String(100), nullable=True, comment='花粉类型'))
    op.add_column('savemyself_daily_logs',
        sa.Column('mold_spores', sa.Integer(), nullable=True, comment='霉菌孢子浓度'))

    # 室内环境
    op.add_column('savemyself_daily_logs',
        sa.Column('indoor_humidity', sa.Float(), nullable=True, comment='室内湿度(%)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('indoor_ventilation', sa.Integer(), nullable=True, comment='通风评分(0-10)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('pet_contact', sa.Boolean(), default=False, comment='是否接触宠物'))
    op.add_column('savemyself_daily_logs',
        sa.Column('dust_exposure', sa.Integer(), nullable=True, comment='灰尘暴露(0-10)'))

    # 生活质量
    op.add_column('savemyself_daily_logs',
        sa.Column('qol_sleep_disruption', sa.Integer(), nullable=True, comment='睡眠干扰(0-10)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('qol_work_impact', sa.Integer(), nullable=True, comment='工作影响(0-10)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('qol_social_impact', sa.Integer(), nullable=True, comment='社交影响(0-10)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('qol_mood', sa.Integer(), nullable=True, comment='情绪状态(0-10)'))

    # 干预效果
    op.add_column('savemyself_daily_logs',
        sa.Column('medication_effectiveness', sa.Integer(), nullable=True, comment='用药效果(0-10)'))
    op.add_column('savemyself_daily_logs',
        sa.Column('treatment_adherence', sa.Integer(), nullable=True, comment='治疗依从性(0-10)'))

    # 元数据
    op.add_column('savemyself_daily_logs',
        sa.Column('env_data_source', sa.String(50), nullable=True, comment='环境数据来源'))
    op.add_column('savemyself_daily_logs',
        sa.Column('env_fetched_at', sa.DateTime(), nullable=True, comment='环境数据获取时间'))


def downgrade():
    """回滚迁移"""

    # 删除 daily_logs 新增字段
    op.drop_column('savemyself_daily_logs', 'env_fetched_at')
    op.drop_column('savemyself_daily_logs', 'env_data_source')
    op.drop_column('savemyself_daily_logs', 'treatment_adherence')
    op.drop_column('savemyself_daily_logs', 'medication_effectiveness')
    op.drop_column('savemyself_daily_logs', 'qol_mood')
    op.drop_column('savemyself_daily_logs', 'qol_social_impact')
    op.drop_column('savemyself_daily_logs', 'qol_work_impact')
    op.drop_column('savemyself_daily_logs', 'qol_sleep_disruption')
    op.drop_column('savemyself_daily_logs', 'dust_exposure')
    op.drop_column('savemyself_daily_logs', 'pet_contact')
    op.drop_column('savemyself_daily_logs', 'indoor_ventilation')
    op.drop_column('savemyself_daily_logs', 'indoor_humidity')
    op.drop_column('savemyself_daily_logs', 'mold_spores')
    op.drop_column('savemyself_daily_logs', 'pollen_type')
    op.drop_column('savemyself_daily_logs', 'pollen_count')
    op.drop_column('savemyself_daily_logs', 'wind_speed')
    op.drop_column('savemyself_daily_logs', 'pressure')
    op.drop_column('savemyself_daily_logs', 'precipitation')
    op.drop_column('savemyself_daily_logs', 'so2')
    op.drop_column('savemyself_daily_logs', 'co')
    op.drop_column('savemyself_daily_logs', 'o3')
    op.drop_column('savemyself_daily_logs', 'no2')
    op.drop_column('savemyself_daily_logs', 'pm10')
    op.drop_column('savemyself_daily_logs', 'pm25')

    # 删除 users 新增字段
    op.drop_column('savemyself_users', 'residence_type')
    op.drop_column('savemyself_users', 'smoking_status')
    op.drop_column('savemyself_users', 'occupation')
    op.drop_column('savemyself_users', 'known_allergens')
    op.drop_column('savemyself_users', 'has_conjunctivitis')
    op.drop_column('savemyself_users', 'has_eczema')
    op.drop_column('savemyself_users', 'has_asthma')
    op.drop_column('savemyself_users', 'family_history')
    op.drop_column('savemyself_users', 'diagnosed_date')
    op.drop_column('savemyself_users', 'rhinitis_type')
