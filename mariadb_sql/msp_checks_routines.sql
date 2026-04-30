CREATE DATABASE  IF NOT EXISTS `msp_checks` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `msp_checks`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 10.14.0.227    Database: msp_checks
-- ------------------------------------------------------
-- Server version	5.5.5-10.11.11-MariaDB-0+deb12u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping events for database 'msp_checks'
--

--
-- Dumping routines for database 'msp_checks'
--
/*!50003 DROP PROCEDURE IF EXISTS `assign_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `assign_template`(
    IN p_template_id INT,
    IN p_customer_id INT,
    IN p_schedule_id INT,
    IN p_group_id INT
)
BEGIN
    INSERT INTO template_assignments (
        template_id, customer_id, schedule_id, group_id
    )
    VALUES (
        p_template_id, p_customer_id, p_schedule_id, p_group_id
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `calculate_next_due_date` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `calculate_next_due_date`(
    IN p_assignment_id INT,
    OUT p_due_date DATETIME
)
BEGIN
    DECLARE v_frequency VARCHAR(20);
    DECLARE v_interval INT;
    DECLARE v_day_of_week SET('mon','tue','wed','thu','fri','sat','sun');
    DECLARE v_day_of_month INT;

    DECLARE v_start_date DATE;
    DECLARE v_last_run DATETIME;

    DECLARE v_base_date DATETIME;
    DECLARE v_candidate DATETIME;

    DECLARE v_today INT;
    DECLARE v_days_to_add INT;

    -- Pull full context
    SELECT 
        s.frequency,
        s.interval_value,
        s.day_of_week,
        s.day_of_month,
        s.start_date,
        ta.last_run
    INTO
        v_frequency,
        v_interval,
        v_day_of_week,
        v_day_of_month,
        v_start_date,
        v_last_run
    FROM template_assignments ta
    JOIN schedules s ON ta.schedule_id = s.id
    WHERE ta.id = p_assignment_id;

    -- Determine base date (deterministic anchor)
    SET v_base_date = IFNULL(v_last_run, v_start_date);

    -- DAILY
    IF v_frequency = 'daily' THEN
        SET v_candidate = v_base_date + INTERVAL v_interval DAY;

    -- WEEKLY (true deterministic)
    ELSEIF v_frequency = 'weekly' THEN

        SET v_today = WEEKDAY(v_base_date);

        SET v_days_to_add = NULL;

        IF FIND_IN_SET('mon', v_day_of_week) AND v_today < 0 THEN SET v_days_to_add = 0 - v_today; END IF;
        IF v_days_to_add IS NULL AND FIND_IN_SET('tue', v_day_of_week) AND v_today < 1 THEN SET v_days_to_add = 1 - v_today; END IF;
        IF v_days_to_add IS NULL AND FIND_IN_SET('wed', v_day_of_week) AND v_today < 2 THEN SET v_days_to_add = 2 - v_today; END IF;
        IF v_days_to_add IS NULL AND FIND_IN_SET('thu', v_day_of_week) AND v_today < 3 THEN SET v_days_to_add = 3 - v_today; END IF;
        IF v_days_to_add IS NULL AND FIND_IN_SET('fri', v_day_of_week) AND v_today < 4 THEN SET v_days_to_add = 4 - v_today; END IF;
        IF v_days_to_add IS NULL AND FIND_IN_SET('sat', v_day_of_week) AND v_today < 5 THEN SET v_days_to_add = 5 - v_today; END IF;
        IF v_days_to_add IS NULL AND FIND_IN_SET('sun', v_day_of_week) AND v_today < 6 THEN SET v_days_to_add = 6 - v_today; END IF;

        IF v_days_to_add IS NULL THEN
            SET v_days_to_add = 7 * v_interval;
        END IF;

        SET v_candidate = v_base_date + INTERVAL v_days_to_add DAY;

    -- MONTHLY
    ELSEIF v_frequency = 'monthly' THEN

        SET v_candidate = DATE_ADD(v_base_date, INTERVAL v_interval MONTH);

        IF v_day_of_month IS NOT NULL THEN
            SET v_candidate = DATE_ADD(
                DATE_FORMAT(v_candidate, '%Y-%m-01'),
                INTERVAL (v_day_of_month - 1) DAY
            );
        END IF;

    ELSE
        SET v_candidate = v_base_date + INTERVAL 1 DAY;
    END IF;

    -- 🚨 WEEKEND ADJUSTMENT
    CASE WEEKDAY(v_candidate)
        WHEN 5 THEN SET v_candidate = v_candidate - INTERVAL 1 DAY; -- Saturday → Friday
        WHEN 6 THEN SET v_candidate = v_candidate - INTERVAL 2 DAY; -- Sunday → Friday
    END CASE;

    SET p_due_date = v_candidate;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_schedule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_schedule`(
    IN p_name VARCHAR(255),
    IN p_frequency VARCHAR(50),
    IN p_interval INT,
    IN p_day_of_week VARCHAR(50),
    IN p_day_of_month INT,
    IN p_start_date DATE,
    IN p_user_id INT
)
BEGIN
    INSERT INTO schedules
    (name, frequency, interval_value, day_of_week, day_of_month, start_date, modified_at, modified_by)
    VALUES
    (p_name, p_frequency, p_interval, p_day_of_week, p_day_of_month, p_start_date, NOW(), p_user_id);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_task_from_assignment` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_task_from_assignment`(
    IN p_assignment_id INT
)
BEGIN
    DECLARE v_template_id INT;
    DECLARE v_customer_id INT;
    DECLARE v_group_id INT;
    DECLARE v_task_id INT;

    SELECT template_id, customer_id, group_id
    INTO v_template_id, v_customer_id, v_group_id
    FROM template_assignments
    WHERE id = p_assignment_id;

    INSERT INTO tasks (
        template_assignment_id,
        template_id,
        customer_id,
        name,
        group_id,
        status_id,
        status_changed_at
    )
    SELECT
        p_assignment_id,
        t.id,
        v_customer_id,
        t.name,
        v_group_id,
        1,
        NOW()
    FROM task_templates t
    WHERE t.id = v_template_id;

    SET v_task_id = LAST_INSERT_ID();

    INSERT INTO task_steps (
        task_id, step_order, title, description
    )
    SELECT
        v_task_id,
        step_order,
        title,
        description
    FROM template_steps
    WHERE template_id = v_template_id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_task_from_assignment_scheduled` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_task_from_assignment_scheduled`(
    IN p_assignment_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_template_id INT;
    DECLARE v_customer_id INT;
    DECLARE v_group_id INT;
    DECLARE v_task_id INT;
    DECLARE v_due_date DATETIME;

    SELECT template_id, customer_id, group_id
    INTO v_template_id, v_customer_id, v_group_id
    FROM template_assignments
    WHERE id = p_assignment_id;

    -- NEW deterministic due date
    CALL calculate_next_due_date(p_assignment_id, v_due_date);

    INSERT INTO tasks (
        template_assignment_id,
        template_id,
        customer_id,
        name,
        group_id,
        due_date,
        status_id,
        status_changed_at,
        status_changed_by,
        modified_at,
        modified_by
    )
    SELECT
        p_assignment_id,
        t.id,
        v_customer_id,
        t.name,
        v_group_id,
        v_due_date,
        (SELECT id FROM task_statuses WHERE name = 'open' LIMIT 1),
        NOW(),
        p_user_id,
        NOW(),
        p_user_id
    FROM task_templates t
    WHERE t.id = v_template_id;

    SET v_task_id = LAST_INSERT_ID();

    INSERT INTO task_steps (
        task_id,
        step_order,
        title,
        description,
        modified_at,
        modified_by
    )
    SELECT
        v_task_id,
        step_order,
        title,
        description,
        NOW(),
        p_user_id
    FROM template_steps
    WHERE template_id = v_template_id;

    -- 🔁 CRITICAL: update last_run deterministically
    UPDATE template_assignments
    SET last_run = v_due_date,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_assignment_id;

    -- Audit
    CALL log_audit(
        'task',
        v_task_id,
        'create',
        p_user_id,
        NULL,
        JSON_OBJECT('due_date', v_due_date)
    );

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_task_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_task_template`(
    IN p_name VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE v_template_id INT;

    INSERT INTO task_templates (name, modified_at, modified_by)
    VALUES (p_name, NOW(), p_user_id);

    SET v_template_id = LAST_INSERT_ID();

    INSERT INTO template_steps
    (template_id, title, step_order, modified_at, modified_by)
    VALUES (v_template_id, p_name, 1, NOW(), p_user_id);

    /* LOG TEMPLATE CREATE */
    INSERT INTO audit_log (
        entity_type, entity_id, action_type, new_value, user_id
    )
    VALUES (
        'template', v_template_id, 'create', p_name, p_user_id
    );

    /* LOG DEFAULT STEP */
    INSERT INTO audit_log (
        entity_type, entity_id, action_type, new_value, user_id
    )
    VALUES (
        'template_step', LAST_INSERT_ID(), 'create', p_name, p_user_id
    );

    SELECT v_template_id AS template_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_template_step` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_template_step`(
    IN p_template_id INT,
    IN p_title VARCHAR(255),
    IN p_user_id INT
)
BEGIN
DECLARE v_order INT;
    DECLARE v_id INT;

    SELECT COALESCE(MAX(step_order),0)+1
    INTO v_order
    FROM template_steps
    WHERE template_id = p_template_id;

    INSERT INTO template_steps
    (template_id, title, step_order, modified_at, modified_by)
    VALUES (p_template_id, p_title, v_order, NOW(), p_user_id);

    SET v_id = LAST_INSERT_ID();

    INSERT INTO audit_log (
        entity_type, entity_id, action_type,
        new_value, user_id
    )
    VALUES (
        'template_step', v_id, 'create',
        p_title, p_user_id
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_user` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_user`(
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(255)
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_group_id INT;

    INSERT INTO users (username, email)
    VALUES (p_username, p_email);

    SET v_user_id = LAST_INSERT_ID();

    INSERT INTO `groups` (name)
    VALUES (p_username);

    SET v_group_id = LAST_INSERT_ID();

    INSERT INTO group_membership (user_id, group_id)
    VALUES (v_user_id, v_group_id);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_template_step` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `delete_template_step`(
    IN p_step_id INT
)
BEGIN
	INSERT INTO audit_log (
        entity_type, entity_id, action_type, user_id
    )
    VALUES (
        'template_step', p_step_id, 'delete', p_user_id
    );

    DELETE FROM template_steps WHERE id = p_step_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `generate_due_tasks` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `generate_due_tasks`(
    IN p_user_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_assignment_id INT;

    DECLARE cur CURSOR FOR
        SELECT id
        FROM template_assignments
        WHERE is_active = 1;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_assignment_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Check for existing open task
        IF NOT EXISTS (
            SELECT 1
            FROM tasks t
            JOIN task_statuses s ON t.status_id = s.id
            WHERE t.template_assignment_id = v_assignment_id
              AND s.name NOT IN ('complete','skipped')
        ) THEN

            CALL create_task_from_assignment_scheduled(v_assignment_id, p_user_id);

        END IF;

    END LOOP;

    CLOSE cur;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_all_assignments` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_all_assignments`()
BEGIN
    SELECT 
        ta.*,
        t.name AS template_name,
        c.name AS customer_name,
        g.name AS group_name
    FROM template_assignments ta
    JOIN task_templates t ON ta.template_id = t.id
    JOIN customers c ON ta.customer_id = c.id
    JOIN `groups` g ON ta.group_id = g.id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_customer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_customer`(
    IN p_customer_id INT
)
BEGIN
    SELECT * FROM customers WHERE id = p_customer_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_customers` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_customers`()
BEGIN
    SELECT * FROM customers ORDER BY name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_customer_assignments` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_customer_assignments`(
    IN p_customer_id INT
)
BEGIN
    SELECT 
        ta.*,
        t.name AS template_name,
        g.name AS group_name,
        s.name AS schedule_name
    FROM template_assignments ta
    JOIN task_templates t ON ta.template_id = t.id
    JOIN `groups` g ON ta.group_id = g.id
    JOIN schedules s ON ta.schedule_id = s.id
    WHERE ta.customer_id = p_customer_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_groups` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_groups`()
BEGIN
    SELECT * FROM `groups` ORDER BY name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_schedules` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_schedules`()
BEGIN
    SELECT * FROM schedules ORDER BY name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_task` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_task`(
    IN p_task_id INT
)
BEGIN
    SELECT 
        t.*,
        c.name AS customer_name
    FROM tasks t
    JOIN customers c ON t.customer_id = c.id
    WHERE t.id = p_task_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_tasks` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_tasks`()
BEGIN
    SELECT 
        t.*,
        c.name AS customer_name,
        s.name AS status_name
    FROM tasks t
    JOIN customers c ON t.customer_id = c.id
    JOIN task_statuses s ON t.status_id = s.id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_task_steps` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_task_steps`(
    IN p_task_id INT
)
BEGIN
    SELECT *
    FROM task_steps
    WHERE task_id = p_task_id
    ORDER BY step_order ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_task_templates` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_task_templates`()
BEGIN
    SELECT * FROM task_templates ORDER BY name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_template_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_template_detail`(
    IN p_template_id INT
)
BEGIN
    SELECT * FROM task_templates WHERE id = p_template_id;

    SELECT *
    FROM template_steps
    WHERE template_id = p_template_id
    ORDER BY step_order ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `reorder_template_steps` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `reorder_template_steps`(
    IN p_template_id INT,
    IN p_step_ids TEXT,
    IN p_user_id INT
)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_id INT;

    WHILE LENGTH(p_step_ids) > 0 DO

        SET v_id = SUBSTRING_INDEX(p_step_ids, ',', 1);

        UPDATE template_steps
        SET step_order = i,
            modified_at = NOW(),
            modified_by = p_user_id
        WHERE id = v_id;

        INSERT INTO audit_log (
            entity_type, entity_id, action_type,
            field_name, new_value, user_id
        )
        VALUES (
            'template_step', v_id, 'reorder',
            'step_order', i, p_user_id
        );

        SET p_step_ids = IF(
            LOCATE(',', p_step_ids) > 0,
            SUBSTRING(p_step_ids, LOCATE(',', p_step_ids) + 1),
            ''
        );

        SET i = i + 1;

    END WHILE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_schedule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_schedule`(
    IN p_id INT,
    IN p_name VARCHAR(255),
    IN p_frequency VARCHAR(50),
    IN p_interval INT,
    IN p_day_of_week VARCHAR(50),
    IN p_day_of_month INT,
    IN p_user_id INT
)
BEGIN
   DECLARE v_old_name VARCHAR(255);

    SELECT name INTO v_old_name FROM schedules WHERE id = p_id;

    UPDATE schedules
    SET name = p_name,
        frequency = p_frequency,
        interval_value = p_interval,
        day_of_week = p_day_of_week,
        day_of_month = p_day_of_month,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_id;

    INSERT INTO audit_log (
        entity_type, entity_id, action_type,
        field_name, old_value, new_value, user_id
    )
    VALUES (
        'schedule', p_id, 'update',
        'name', v_old_name, p_name, p_user_id
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_task_status` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_task_status`(
    IN p_task_id INT,
    IN p_status_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_before JSON;

    SELECT JSON_OBJECT(
        'status_id', status_id
    )
    INTO v_before
    FROM tasks
    WHERE id = p_task_id;

    UPDATE tasks
    SET
        status_id = p_status_id,
        status_changed_at = NOW(),
        status_changed_by = p_user_id,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_task_id;

    CALL log_audit(
        'task',
        p_task_id,
        'status_update',
        p_user_id,
        v_before,
        JSON_OBJECT('status_id', p_status_id)
    );

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_task_step` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_task_step`(
    IN p_step_id INT,
    IN p_completed TINYINT,
    IN p_user_id INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE v_before JSON;

    SELECT JSON_OBJECT(
        'is_completed', is_completed,
        'notes', notes
    )
    INTO v_before
    FROM task_steps
    WHERE id = p_step_id;

    UPDATE task_steps
    SET
        is_completed = p_completed,
        completed_by = IF(p_completed = 1, p_user_id, NULL),
        completed_at = IF(p_completed = 1, NOW(), NULL),
        notes = p_notes,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_step_id;

    CALL log_audit(
        'task_step',
        p_step_id,
        'update',
        p_user_id,
        v_before,
        JSON_OBJECT('is_completed', p_completed, 'notes', p_notes)
    );

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_task_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_task_template`(
    IN p_template_id INT,
    IN p_name VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE v_old_name VARCHAR(255);

    SELECT name INTO v_old_name
    FROM task_templates
    WHERE id = p_template_id;

    UPDATE task_templates
    SET name = p_name,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_template_id;

    INSERT INTO audit_log (
        entity_type, entity_id, action_type,
        field_name, old_value, new_value, user_id
    )
    VALUES (
        'template', p_template_id, 'update',
        'name', v_old_name, p_name, p_user_id
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_template_assignment_group` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_template_assignment_group`(
    IN p_assignment_id INT,
    IN p_group_id INT,
    IN p_user_id INT
)
BEGIN
	DECLARE v_old_group INT;

    SELECT group_id INTO v_old_group FROM schedules WHERE id = p_assignment_id;
    UPDATE template_assignments
    SET group_id = p_group_id,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_assignment_id;
	INSERT INTO audit_log (
        entity_type, entity_id, action_type,
        field_name, old_value, new_value, user_id
    )
    VALUES (
        'assignment', p_assignment_id, 'update',
        'group', v_old_group, p_group_id, p_user_id
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_template_step` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_template_step`(
    IN p_step_id INT,
    IN p_title VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE v_old TEXT;

    SELECT title INTO v_old
    FROM template_steps
    WHERE id = p_step_id;

    UPDATE template_steps
    SET title = p_title,
        modified_at = NOW(),
        modified_by = p_user_id
    WHERE id = p_step_id;

    INSERT INTO audit_log (
        entity_type, entity_id, action_type,
        field_name, old_value, new_value, user_id
    )
    VALUES (
        'template_step', p_step_id, 'update',
        'title', v_old, p_title, p_user_id
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-28 22:27:43
