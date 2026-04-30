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
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `modified_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'CASH SALES',1,'2026-04-14 23:02:44'),(2,'Test Customer',1,'2026-04-14 23:02:44'),(3,'1600 Pioneer Tower (TXRE)',1,'2026-04-14 23:02:44'),(4,'1700 Tennison Parkway, LLC',1,'2026-04-14 23:02:44'),(5,'1701 E. Lamar, LLC (TXRE)',1,'2026-04-14 23:02:44'),(6,'1924 Trucking LLC',1,'2026-04-14 23:02:44'),(7,'2261 Brookhollow Plaza Drive (TXRE)',1,'2026-04-14 23:02:44'),(8,'300/320 Decker LLC (TXRE)',1,'2026-04-14 23:02:44'),(9,'3108 Partners, Ltd',1,'2026-04-14 23:02:44'),(10,'3i Contracting, LLC',1,'2026-04-14 23:02:44'),(11,'7929 Brookriver LP (TXRE)',1,'2026-04-14 23:02:44'),(12,'A+ Insurance Designers',1,'2026-04-14 23:02:44'),(13,'Acorn Stair Lifts',1,'2026-04-14 23:02:44'),(14,'Albany Road-Hillcrest LLC (TXRE)',1,'2026-04-14 23:02:44'),(15,'Albany Road-Mockingbird II LLC (1250',1,'2026-04-14 23:02:44'),(16,'Albany Road-Mockingbird III LLC (TXRE)',1,'2026-04-14 23:02:44'),(17,'Albany Road-Mockingbird LLC (1341 W M',1,'2026-04-14 23:02:44'),(18,'Aspen Group',1,'2026-04-14 23:02:44'),(19,'Aspen Group - Crossroads Decatur',1,'2026-04-14 23:02:44'),(20,'Blended Kingdom Family',1,'2026-04-14 23:02:44'),(21,'Brad Baker',1,'2026-04-14 23:02:44'),(22,'BRI 1873 One Allen, LLC (Accesso)',1,'2026-04-14 23:02:44'),(23,'Bridgeport Equipment Service / Paradi',1,'2026-04-14 23:02:44'),(24,'Burnett Cherry Street, LLC (TXRE)',1,'2026-04-14 23:02:44'),(25,'Choice Bagging Equipment',1,'2026-04-14 23:02:44'),(26,'Chronim Investments dba Snider Advisors',1,'2026-04-14 23:02:44'),(27,'City Of Bridgeport',1,'2026-04-14 23:02:44'),(28,'Consortium of Independent Immunology',1,'2026-04-14 23:02:44'),(29,'Crossroads Church',1,'2026-04-14 23:02:44'),(30,'D.R.I. Enterprises, Ltd. (National Roper\'s Supply)',1,'2026-04-14 23:02:44'),(31,'Daniel Suez MD AAIC PA',1,'2026-04-14 23:02:44'),(32,'Daryl Ground & Associates',1,'2026-04-14 23:02:44'),(33,'Dr. Frank Rosales',1,'2026-04-14 23:02:44'),(34,'Dr. Gene Payne DDS',1,'2026-04-14 23:02:44'),(35,'Dr. Ricardo Martinez, MD',1,'2026-04-14 23:02:44'),(36,'Elite Pro Technology (L33t Tech, LLC)',1,'2026-04-14 23:02:44'),(37,'First Baptist Church of Cottondale',1,'2026-04-14 23:02:44'),(38,'Franklin Media',1,'2026-04-14 23:02:44'),(39,'Frontiers of Flight Museum',1,'2026-04-14 23:02:44'),(40,'Grace Fellowship Church (Paradise)',1,'2026-04-14 23:02:44'),(41,'Greenlight Clinical',1,'2026-04-14 23:02:44'),(42,'Hayhurst Brothers',1,'2026-04-14 23:02:44'),(43,'Healthworks',1,'2026-04-14 23:02:44'),(44,'Henderson, Melissa',1,'2026-04-14 23:02:44'),(45,'Hotel Dryce, LLC',1,'2026-04-14 23:02:44'),(46,'HQ Integrations',1,'2026-04-14 23:02:44'),(47,'Jason Erwin',1,'2026-04-14 23:02:44'),(48,'Jung J Noh ',1,'2026-04-14 23:02:44'),(49,'Koosmann, Bradford 1000009',1,'2026-04-14 23:02:44'),(50,'KSR Wealth Management',1,'2026-04-14 23:02:44'),(51,'L&K Logistics',1,'2026-04-14 23:02:44'),(52,'LBJ Center, LLC',1,'2026-04-14 23:02:44'),(53,'Lewis, Patricia 1000012',1,'2026-04-14 23:02:44'),(54,'Liberty CenterPoint, LLC (TXRE)',1,'2026-04-14 23:02:44'),(55,'Liberty Las Colinas, LLC The Pointe',1,'2026-04-14 23:02:44'),(56,'MAG Law PLLC',1,'2026-04-14 23:02:44'),(57,'Mitchell D. Stevens III LLC',1,'2026-04-14 23:02:44'),(58,'National Computer',1,'2026-04-14 23:02:44'),(59,'Nine Energy Service (Corporate)',1,'2026-04-14 23:02:44'),(60,'Nine Energy Service (Jacksboro)',1,'2026-04-14 23:02:44'),(61,'Nine Energy Service (Poolville)',1,'2026-04-14 23:02:44'),(62,'Over The Hill RV',1,'2026-04-14 23:02:44'),(63,'Passage Church',1,'2026-04-14 23:02:44'),(64,'Pediatric Home Service (Hope Pediatrics)',1,'2026-04-14 23:02:44'),(65,'Perdomo Dorsett Immigration Law',1,'2026-04-14 23:02:44'),(66,'PIN Paws',1,'2026-04-14 23:02:44'),(67,'Preferred Materials, LLC',1,'2026-04-14 23:02:44'),(68,'Prescott Polk, Cassandra 1000014',1,'2026-04-14 23:02:44'),(69,'Raices',1,'2026-04-14 23:02:44'),(70,'RC Pros Plumbing',1,'2026-04-14 23:02:44'),(71,'Reab Berry',1,'2026-04-14 23:02:44'),(72,'Republic Health Resources',1,'2026-04-14 23:02:44'),(73,'Ricchi Plaza Dallas, LLC',1,'2026-04-14 23:02:44'),(74,'Riloma, LLC  (Ricchi Group Corporate)',1,'2026-04-14 23:02:44'),(75,'Rotherham, Jim',1,'2026-04-14 23:02:44'),(76,'Sand Hill Events. LLC (NRS)',1,'2026-04-14 23:02:44'),(77,'Service Broadcasting LLC',1,'2026-04-14 23:02:44'),(78,'Sevn Therapy Company',1,'2026-04-14 23:02:44'),(79,'Singer Association Management',1,'2026-04-14 23:02:44'),(80,'Steinger, Greene & Feiner Injury Lawy',1,'2026-04-14 23:02:44'),(81,'Texas RV Guys LLC',1,'2026-04-14 23:02:44'),(82,'TruAura, LLC',1,'2026-04-14 23:02:44'),(83,'TXRE Properties, LLC (Corporate)',1,'2026-04-14 23:02:44'),(84,'Vendera Management Holdings, LLC',1,'2026-04-14 23:02:44'),(85,'Visiting Nurse Association of Texas',1,'2026-04-14 23:02:44'),(86,'Walls Printing',1,'2026-04-14 23:02:44'),(87,'Whammy FX LLC',1,'2026-04-14 23:02:44'),(88,'Wise ISP, LLC',1,'2026-04-14 23:02:44'),(89,'Miphouvieng, Vong',1,'2026-04-14 23:02:44'),(90,'NXT Fiber Wave',1,'2026-04-14 23:02:44'),(91,'Greenhill Insurance',1,'2026-04-14 23:02:44'),(92,'Test Cust 2',1,'2026-04-14 23:02:44');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-28 22:27:41
