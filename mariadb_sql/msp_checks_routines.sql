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
/*!50003 DROP PROCEDURE IF EXISTS `log_audit` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `log_audit`(
    IN p_entity_type varchar(50),
    IN p_entity_id INT,
    IN p_action_type varchar(50),
	IN p_user_id INT,
	IN p_old_value text,
	IN p_new_value text

)
BEGIN
    INSERT INTO audit_log (
        entity_type, entity_id, action_type, old_value, new_value, user_id
    )
    VALUES (
        p_entity_type, p_entity_id, p_action_type, p_old_value, p_new_value, p_user_id
    );
	
END ;;
DELIMITER ;
/*!50003 DROP PROCEDURE IF EXISTS `create_assignment` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_assignment`(
    IN p_template_id INT,
    IN p_customer_id INT,
    IN p_schedule_id INT,
    IN p_group_id INT,
	IN p_user_id INT
)
BEGIN
    INSERT INTO assignments (
        template_id, customer_id, schedule_id, group_id, modified_at, modified_by
    )
    VALUES (
        p_template_id, p_customer_id, p_schedule_id, p_group_id, CURRENT_TIMESTAMP, p_user_id
    );
	
	CALL log_audit(
        'assignment',
        LAST_INSERT_ID(),
        'create',
        p_user_id,
        NULL,
        JSON_OBJECT('template_id', p_template_id, 'customer_id', p_customer_id, 'schedule_id', p_schedule_id, 'group_id', p_group_id)
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
	DECLARE v_month_of_year INT;

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
		s.month_of_year,
        s.start_date,
        a.last_run
    INTO
        v_frequency,
        v_interval,
        v_day_of_week,
        v_day_of_month,
		v_month_of_year,
        v_start_date,
        v_last_run
    FROM assignments a
    JOIN schedules s ON a.schedule_id = s.id
    WHERE a.id = p_assignment_id;

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

	-- YEARLY
    ELSEIF v_frequency = 'yearly' THEN

        SET v_candidate = DATE_ADD(v_base_date, INTERVAL v_interval YEAR);
		IF v_month_of_year IS NOT NULL THEN
            SET v_candidate = DATE_ADD(
                DATE_FORMAT(v_candidate, '%Y-01-%d'),
                INTERVAL (v_month_of_year - 1) MONTH
            );
        END IF;
        IF v_day_of_month IS NOT NULL THEN
            SET v_candidate = DATE_ADD(
                DATE_FORMAT(v_candidate, '%Y-%m-01'),
                INTERVAL (v_day_of_month - 1) DAY
            );
        END IF;
    ELSE
        SET v_candidate = v_base_date + INTERVAL 1 DAY;
    END IF;

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
	IN p_month_of_year INT,
    IN p_start_date DATE,
    IN p_user_id INT
)
BEGIN
    INSERT INTO schedules
    (name, frequency, interval_value, day_of_week, day_of_month, month_of_year, start_date, modified_at, modified_by)
    VALUES
    (p_name, p_frequency, p_interval, p_day_of_week, p_day_of_month, p_month_of_year, p_start_date, CURRENT_TIMESTAMP, p_user_id);
	
	CALL log_audit(
        'schedule',
        LAST_INSERT_ID(),
        'create',
        p_user_id,
        NULL,
        JSON_OBJECT('name', p_name, 'frequency', p_frequency, 'interval_value', p_interval, 'day_of_week', p_day_of_week, 'day_of_month', p_day_of_month, 'month_of_year', p_month_of_year, 'start_date', p_start_date)
    );
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
    FROM assignments
    WHERE id = p_assignment_id;

    -- NEW deterministic due date
    CALL calculate_next_due_date(p_assignment_id, v_due_date);

    INSERT INTO tasks (
        assignments_id,
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
        CURRENT_TIMESTAMP,
        p_user_id,
        CURRENT_TIMESTAMP,
        p_user_id
    FROM templates t
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
        CURRENT_TIMESTAMP,
        p_user_id
    FROM template_steps
    WHERE template_id = v_template_id;

    UPDATE assignments
    SET last_run = v_due_date,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = p_user_id
    WHERE id = p_assignment_id;

    -- Audit
    /*CALL log_audit(
        'task',
        v_task_id,
        'create',
        p_user_id,
        NULL,
        JSON_OBJECT('due_date', v_due_date)
    );*/

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `create_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `create_template`(
    IN p_name VARCHAR(255),
	IN p_description TEXT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_template_id INT;

    INSERT INTO templates (name, description, modified_at, modified_by)
    VALUES (p_name, p_description, CURRENT_TIMESTAMP, p_user_id);

    SET v_template_id = LAST_INSERT_ID();
	
	CALL log_audit(
        'template',
        v_template_id,
        'create',
        p_user_id,
        NULL,
        JSON_OBJECT('name', p_name, 'description', p_description)
    );
	
    CALL create_template_step(v_template_id, p_name, p_description, p_user_id);

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
	IN p_description text,
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
    (template_id, title, description, step_order, modified_at, modified_by)
    VALUES (p_template_id, p_title, p_description, v_order, CURRENT_TIMESTAMP, p_user_id);

    SET v_id = LAST_INSERT_ID();

    CALL log_audit(
        'template_step',
        v_id,
        'create',
        p_user_id,
        NULL,
        JSON_OBJECT('title', p_title, 'description', p_description)
    );
	SELECT v_id as id;
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
/*!50003 DROP PROCEDURE IF EXISTS `delete_assignment` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `delete_assignment`(
    IN p_assignment_id INT,
	IN p_user_id INT
)
BEGIN
	CALL log_audit(
        'assignment',
        p_assignment_id,
        'delete',
        p_user_id,
        NULL,
        NULL
    );

    UPDATE assignments SET is_active = 0, modified_by = p_user_id , modified_at = current_timestamp WHERE id = p_assignment_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_schedule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `delete_schedule`(
    IN p_schedule_id INT,
	IN p_user_id INT
)
BEGIN
	CALL log_audit(
        'schedule',
        p_schedule_id,
        'delete',
        p_user_id,
        NULL,
        NULL
    );

    UPDATE schedules SET is_active = 0, modified_by = p_user_id , modified_at = current_timestamp WHERE id = p_schedule_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `delete_template`(
    IN p_template_id INT,
	IN p_user_id INT
)
BEGIN
	CALL log_audit(
        'template',
        p_template_id,
        'delete',
        p_user_id,
        NULL,
        NULL
    );

    UPDATE templates SET is_active = 0, modified_by = p_user_id , modified_at = current_timestamp WHERE id = p_template_id;
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
    IN p_step_id INT,
	IN p_user_id INT
)
BEGIN
	CALL log_audit(
        'template_step',
        p_step_id,
        'delete',
        p_user_id,
        NULL,
        NULL
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
        FROM assignments
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
            WHERE t.assignments_id = v_assignment_id
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
/*!50003 DROP PROCEDURE IF EXISTS `get_assignments` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_assignments`()
BEGIN
    SELECT 
        a.id,
		a.template_id,
		a.customer_id,
		a.schedule_id,
		a.group_id,
        t.name AS template_name,
        c.name AS customer_name,
        g.name AS group_name
    FROM assignments a
    JOIN templates t ON a.template_id = t.id
    JOIN vw_customers c ON a.customer_id = c.id
    JOIN `groups` g ON a.group_id = g.id
	where a.is_active = 1;
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
    SELECT 
		c.id,
		c.name,
		c.service_level,
		sl.name AS service_level_name, 
		sl.priority as service_level_priority
	FROM vw_customers c
	LEFT JOIN customer_service_levels sl on c.service_level = sl.id 
	WHERE c.id = p_customer_id;
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
    SELECT 
		c.id,
		c.name,
		c.service_level,
		sl.name AS service_level_name, 
		sl.priority as service_level_priority 
	FROM vw_customers c 
	LEFT JOIN customer_service_levels sl on c.service_level = sl.id 
	ORDER BY sl.priority, c.name;
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
        a.id,
		a.template_id,
		a.customer_id,
		a.schedule_id,
		a.group_id,
        t.name AS template_name,
        g.name AS group_name,
        s.name AS schedule_name
    FROM assignments a
    JOIN templates t ON a.template_id = t.id
    JOIN `groups` g ON a.group_id = g.id
    JOIN schedules s ON a.schedule_id = s.id
    WHERE a.customer_id = p_customer_id
		AND a.is_active = 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_customer_tickets` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_customer_tickets`(
    IN p_customer_id INT
)
BEGIN
    SELECT 
        t.id,
		t.title,
		t.status,
		t.TechnicianID,
		t.LastTechnicianCommentTimestamp,
		c.id as customer_id,
		c.name as customer_name,
		c.service_level,
		'' as service_level_name,
		99 as service_levels_priority
    FROM atera.tickets t
    JOIN vw_customers c ON c.atera_id = t.customerID
    WHERE c.atera_id = p_customer_id
		AND t.status not in ('Deleted','Spam', 'Merged')
		AND t.status not in ('Resolved', 'Closed')
			OR DATE(t.LastTechnicianCommentTimestamp) = CURRENT_DATE();
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
    SELECT 
		id,
		name
	FROM `groups` 
	WHERE is_active = 1
	ORDER BY name;
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
    SELECT 
		id,
		name,
		frequency,
		interval_value,
		day_of_week,
		day_of_month,
		month_of_year
	FROM schedules 
	WHERE is_active = 1 
	ORDER BY name;
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
        t.id,
        t.assignments_id,
        t.customer_id,
        t.template_id,
        t.name,
        t.description,
        t.group_id,
        t.due_date,
        t.status_id,
        c.name AS customer_name
    FROM tasks t
    JOIN vw_customers c ON t.customer_id = c.id
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
        t.id,
        t.assignments_id,
        t.customer_id,
        t.template_id,
        t.name,
        t.description,
        t.group_id,
        t.due_date,
        t.status_id,
        c.name AS customer_name,
        s.name AS status_name
    FROM tasks t
    JOIN vw_customers c ON t.customer_id = c.id
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
    SELECT 
		id,
		task_id,
		step_order,
		title,
		description,
		is_completed,
		completed_by,
		completed_at,
		notes
    FROM task_steps
    WHERE task_id = p_task_id
    ORDER BY step_order ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_templates` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_templates`()
BEGIN
    SELECT 
		id,
		name,
		description
	FROM templates 
	WHERE is_active = 1 
	ORDER BY name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_template`(
    IN p_template_id INT
)
BEGIN
    SELECT 
		id,
		name,
		description
	FROM templates
	WHERE id = p_template_id;

    SELECT 
		id,
		template_id,
		step_order,
		title,
		description
    FROM template_steps
    WHERE template_id = p_template_id
    ORDER BY step_order ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_tickets` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `get_tickets`()
BEGIN
    SELECT 
        t.id,
		t.title,
		t.status,
		t.TechnicianID,
		t.LastTechnicianCommentTimestamp,
		c.id as customer_id,
		c.name as customer_name,
		c.service_level,
		'' as service_level_name,
		99 as service_levels_priority
    FROM atera.tickets t
    JOIN vw_customers c ON c.atera_id = t.customerID
    WHERE t.status not in ('Deleted','Spam', 'Merged')
		AND t.status not in ('Resolved', 'Closed')
			OR DATE(t.LastTechnicianCommentTimestamp) = CURRENT_DATE();
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
            modified_at = CURRENT_TIMESTAMP,
            modified_by = p_user_id
        WHERE id = v_id;

        SET p_step_ids = IF(
            LOCATE(',', p_step_ids) > 0,
            SUBSTRING(p_step_ids, LOCATE(',', p_step_ids) + 1),
            ''
        );

        SET i = i + 1;

    END WHILE;
	
	CALL log_audit(
        'template_steps',
        p_template_id,
        'reorder',
        p_user_id,
        JSON_OBJECT('step_order', NULL),
        JSON_OBJECT('step_order', p_step_ids)
    );
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
	IN p_month_of_year INT,
    IN p_user_id INT
)
BEGIN
   DECLARE v_before JSON;

    SELECT JSON_OBJECT('name', name,
						'frequency', frequency,
						'interval_value', interval_value,
						'day_of_week', day_of_week,
						'day_of_month', day_of_month,
						'month_of_year', month_of_year) INTO v_before FROM schedules WHERE id = p_id;

    UPDATE schedules
    SET name = p_name,
        frequency = p_frequency,
        interval_value = p_interval,
        day_of_week = p_day_of_week,
        day_of_month = p_day_of_month,
		month_of_year = p_month_of_year,
        modified_at = CURRENT_TIMESTAMP,
        modified_by = p_user_id
    WHERE id = p_id;

    CALL log_audit(
        'schedule',
        p_id,
        'reorder',
        p_user_id,
        v_before,
        JSON_OBJECT('name', p_name,
					'frequency', p_frequency,
					'interval_value', p_interval,
					'day_of_week', p_day_of_week,
					'day_of_month', p_day_of_month,
					'month_of_year', p_month_of_year)
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
	
	IF p_status_id = (SELECT id FROM task_statuses WHERE name = 'complete') THEN
		UPDATE task_steps
		SET 
			is_completed = 1,
			completed_at = CURRENT_TIMESTAMP,
			completed_by = p_user_id,
			notes = 'auto-completed'
		WHERE task_id = p_task_id
		  AND is_completed = 0;
	END IF;

    UPDATE tasks
    SET
        status_id = p_status_id,
        status_changed_at = CURRENT_TIMESTAMP,
        status_changed_by = p_user_id,
        modified_at = CURRENT_TIMESTAMP,
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
        completed_at = IF(p_completed = 1, CURRENT_TIMESTAMP, NULL),
        notes = p_notes,
        modified_at = CURRENT_TIMESTAMP,
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
/*!50003 DROP PROCEDURE IF EXISTS `update_template` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_template`(
    IN p_template_id INT,
    IN p_name VARCHAR(255),
	IN p_description text,
    IN p_user_id INT
)
BEGIN
    DECLARE v_before JSON;

    SELECT JSON_OBJECT('name', name, 'description', description) INTO v_before
    FROM templates
    WHERE id = p_template_id;

    UPDATE templates
    SET name = p_name,
		description = IFNULL(p_description, description),
        modified_at = CURRENT_TIMESTAMP,
        modified_by = p_user_id
    WHERE id = p_template_id;

    CALL log_audit(
        'template',
        p_template_id,
        'update',
        p_user_id,
        v_before,
        JSON_OBJECT('name', p_name, 'description', p_description)
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `update_assignments_group` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`shaun`@`%` PROCEDURE `update_assignments_group`(
    IN p_assignment_id INT,
    IN p_group_id INT,
	IN p_schedule_id INT,
    IN p_user_id INT
)
BEGIN
	DECLARE v_before JSON;

    SELECT JSON_OBJECT('group_id', group_id, 'schedule_id', schedule_id) INTO v_before
    FROM assignments
    WHERE id = p_assignment_id;
	
    UPDATE assignments
    SET group_id = IFNULL(p_group_id, group_id),
		schedule_id = IFNULL(p_schedule_id, schedule_id),
        modified_at = CURRENT_TIMESTAMP,
        modified_by = p_user_id
    WHERE id = p_assignment_id;
	
	CALL log_audit(
        'assignment',
        p_assignment_id,
        'update',
        p_user_id,
        v_before,
        JSON_OBJECT('group_id', IFNULL(p_group_id, ''), 'schedule_id', IFNULL(p_schedule_id, ''))
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
	IN p_description TEXT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_before JSON;

    SELECT JSON_OBJECT('title', p_title, 'description', p_description) INTO v_before
    FROM template_steps
    WHERE id = p_step_id;

    UPDATE template_steps
    SET title = p_title,
		description = IFNULL(p_description, description),
        modified_at = CURRENT_TIMESTAMP,
        modified_by = p_user_id
    WHERE id = p_step_id;

    CALL log_audit(
        'template_step',
        p_step_id,
        'update',
        p_user_id,
        v_before,
        JSON_OBJECT('title', p_title, 'description', IFNULL(p_description, ''))
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP VIEW IF EXISTS `vw_customers` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE ALGORITHM=UNDEFINED DEFINER=`shaun`@`%` SQL SECURITY DEFINER VIEW `vw_customers` 
AS 
	SELECT 
		`msp_checks`.`customers`.`id` AS `id`,
		`msp_checks`.`customers`.`name` AS `name`,
		0 AS `service_level`,
		`msp_checks`.`customers`.`atera_id` AS `atera_id` 
	FROM `msp_checks`.`customers`;;
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
