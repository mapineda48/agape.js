BEGIN;

WITH new_person AS (
  INSERT INTO "agape_app_development_demo"."person" (first_name, last_name, birthdate, email, phone)
  VALUES ('Miguel', 'Pineda', NOW()::date, 'root@agape.com', '000000000000')
  RETURNING id
),
new_role AS (
  INSERT INTO "agape_app_development_demo"."staff_role" (code, name, description, is_active)
  VALUES ('SP', 'super user', 'super user', FALSE)
  RETURNING id
),
new_employee AS (
  INSERT INTO "agape_app_development_demo"."staff_employee" (person_id, hire_date, is_active, avatar_url)
  SELECT id, NOW()::date, TRUE, '/admin.jpg'
  FROM new_person
  RETURNING id
),
ins_employee_role AS (
  INSERT INTO "agape_app_development_demo"."staff_employee_roles" (employee_id, role_id)
  SELECT e.id, r.id
  FROM new_employee e, new_role r
  RETURNING employee_id, role_id
),
ins_access_user AS (
  INSERT INTO "agape_app_development_demo"."access_employee" (employee_id, username, password_hash)
  SELECT e.id, 'root', 'sera_que_esta_contraseña_sirve_señor_hacker?'
  FROM new_employee e
  RETURNING id AS access_user_id
)
SELECT
  (SELECT id FROM new_person)      AS person_id,
  (SELECT id FROM new_role)        AS role_id,
  (SELECT id FROM new_employee)    AS employee_id,
  (SELECT access_user_id FROM ins_access_user) AS access_user_id;

COMMIT;
