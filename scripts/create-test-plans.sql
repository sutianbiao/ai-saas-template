-- 创建测试会员计划数据
-- 注意：这些是测试数据，price_xxx 需要替换为真实的Stripe价格ID

-- 清空现有数据（可选）
-- DELETE FROM membership_plans;

-- 插入免费计划
INSERT INTO membership_plans (
    name, name_zh, description, description_zh,
    price_usd_monthly, price_cny_monthly, price_usd_yearly, price_cny_yearly,
    yearly_discount_percent,
    stripe_price_id_usd_monthly, stripe_price_id_cny_monthly, 
    stripe_price_id_usd_yearly, stripe_price_id_cny_yearly,
    creem_price_id_usd_monthly, creem_price_id_cny_monthly,
    creem_price_id_usd_yearly, creem_price_id_cny_yearly,
    features, features_zh,
    max_use_cases, max_tutorials, max_blogs, max_api_calls,
    permissions,
    is_active, is_popular, is_featured, sort_order
) VALUES (
    'Free', '免费版',
    'Perfect for getting started', '完美的入门选择',
    0.00, 0.00, 0.00, 0.00,
    0,
    NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    '["Up to 5 use cases", "Basic tutorials", "Community support", "Basic analytics"]'::json,
    '["最多5个使用案例", "基础教程", "社区支持", "基础分析"]'::json,
    5, 10, 3, 100,
    '{"apiAccess": false, "customModels": false, "prioritySupport": false, "exportData": false, "bulkOperations": false, "advancedAnalytics": false}'::json,
    true, false, false, 1
);

-- 插入基础计划 (需要替换真实的Stripe价格ID)
INSERT INTO membership_plans (
    name, name_zh, description, description_zh,
    price_usd_monthly, price_cny_monthly, price_usd_yearly, price_cny_yearly,
    yearly_discount_percent,
    stripe_price_id_usd_monthly, stripe_price_id_cny_monthly, 
    stripe_price_id_usd_yearly, stripe_price_id_cny_yearly,
    creem_price_id_usd_monthly, creem_price_id_cny_monthly,
    creem_price_id_usd_yearly, creem_price_id_cny_yearly,
    features, features_zh,
    max_use_cases, max_tutorials, max_blogs, max_api_calls,
    permissions,
    is_active, is_popular, is_featured, sort_order
) VALUES (
    'Basic', '基础版',
    'Great for individuals and small teams', '适合个人和小团队',
    9.99, 68.00, 99.99, 680.00,
    17,
    'price_basic_monthly_test', 'price_basic_monthly_cny_test',
    'price_basic_yearly_test', 'price_basic_yearly_cny_test',
    'creem_basic_monthly_usd_test', 'creem_basic_monthly_cny_test',
    'creem_basic_yearly_usd_test', 'creem_basic_yearly_cny_test',
    '["Up to 50 use cases", "Advanced tutorials", "Email support", "Export functionality", "Basic API access"]'::json,
    '["最多50个使用案例", "高级教程", "邮件支持", "导出功能", "基础API访问"]'::json,
    50, 100, 20, 1000,
    '{"apiAccess": true, "customModels": false, "prioritySupport": false, "exportData": true, "bulkOperations": false, "advancedAnalytics": false}'::json,
    true, true, false, 2
);

-- 插入专业计划
INSERT INTO membership_plans (
    name, name_zh, description, description_zh,
    price_usd_monthly, price_cny_monthly, price_usd_yearly, price_cny_yearly,
    yearly_discount_percent,
    stripe_price_id_usd_monthly, stripe_price_id_cny_monthly, 
    stripe_price_id_usd_yearly, stripe_price_id_cny_yearly,
    creem_price_id_usd_monthly, creem_price_id_cny_monthly,
    creem_price_id_usd_yearly, creem_price_id_cny_yearly,
    features, features_zh,
    max_use_cases, max_tutorials, max_blogs, max_api_calls,
    permissions,
    is_active, is_popular, is_featured, sort_order
) VALUES (
    'Pro', '专业版',
    'Perfect for growing businesses', '适合成长型企业',
    29.99, 198.00, 299.99, 1980.00,
    17,
    'price_pro_monthly_test', 'price_pro_monthly_cny_test',
    'price_pro_yearly_test', 'price_pro_yearly_cny_test',
    'creem_pro_monthly_usd_test', 'creem_pro_monthly_cny_test',
    'creem_pro_yearly_usd_test', 'creem_pro_yearly_cny_test',
    '["Unlimited use cases", "Premium tutorials", "Priority support", "Advanced analytics", "Custom models", "Bulk operations"]'::json,
    '["无限使用案例", "高级教程", "优先支持", "高级分析", "自定义模型", "批量操作"]'::json,
    -1, -1, -1, 10000,
    '{"apiAccess": true, "customModels": true, "prioritySupport": true, "exportData": true, "bulkOperations": true, "advancedAnalytics": true}'::json,
    true, false, true, 3
);

-- 插入企业计划
INSERT INTO membership_plans (
    name, name_zh, description, description_zh,
    price_usd_monthly, price_cny_monthly, price_usd_yearly, price_cny_yearly,
    yearly_discount_percent,
    stripe_price_id_usd_monthly, stripe_price_id_cny_monthly, 
    stripe_price_id_usd_yearly, stripe_price_id_cny_yearly,
    creem_price_id_usd_monthly, creem_price_id_cny_monthly,
    creem_price_id_usd_yearly, creem_price_id_cny_yearly,
    features, features_zh,
    max_use_cases, max_tutorials, max_blogs, max_api_calls,
    permissions,
    is_active, is_popular, is_featured, sort_order
) VALUES (
    'Enterprise', '企业版',
    'For large organizations with advanced needs', '适合有高级需求的大型组织',
    99.99, 688.00, 999.99, 6880.00,
    17,
    'price_enterprise_monthly_test', 'price_enterprise_monthly_cny_test',
    'price_enterprise_yearly_test', 'price_enterprise_yearly_cny_test',
    'creem_enterprise_monthly_usd_test', 'creem_enterprise_monthly_cny_test',
    'creem_enterprise_yearly_usd_test', 'creem_enterprise_yearly_cny_test',
    '["Everything in Pro", "Dedicated support", "Custom integrations", "Advanced security", "SLA guarantee", "White-label options"]'::json,
    '["包含专业版所有功能", "专属支持", "自定义集成", "高级安全", "SLA保证", "白标选项"]'::json,
    -1, -1, -1, -1,
    '{"apiAccess": true, "customModels": true, "prioritySupport": true, "exportData": true, "bulkOperations": true, "advancedAnalytics": true}'::json,
    true, false, false, 4
);

-- 查询验证
SELECT 
    name, name_zh, 
    price_usd_monthly, price_usd_yearly,
    stripe_price_id_usd_monthly, stripe_price_id_usd_yearly,
    is_active, is_popular, sort_order
FROM membership_plans 
ORDER BY sort_order;

-- 重要提醒：
-- 1. 将 price_xxx_test 替换为真实的Stripe价格ID
-- 2. 在Stripe控制台创建对应的订阅价格
-- 3. 价格ID格式应该是 price_1234567890abcdef 