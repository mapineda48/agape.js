# Crea un grupo de recursos en Azure llamado "agape" en la región "East US". 
# Los grupos de recursos son contenedores que agrupan recursos relacionados para su fácil gestión.
resource "azurerm_resource_group" "agape" {
  name     = "agape"
  location = "East US"

  tags = {
    environment = "Demo"
  }
}

# Define una red virtual llamada "agape-vn" con un espacio de direcciones IP de 10.1.0.0/16. 
# Esta red se usa para alojar subredes y otros recursos relacionados con la red.
resource "azurerm_virtual_network" "agape" {
  name                = "agape-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.agape.location
  resource_group_name = azurerm_resource_group.agape.name
}

# Configura una subred específica dentro de la red virtual, diseñada para alojar servidores PostgreSQL flexibles. 
# La subred tiene habilitados puntos de conexión de servicio para el almacenamiento de Microsoft y está delegada 
# específicamente para servidores PostgreSQL flexibles(Microsoft.DBforPostgreSQL/flexibleServers) fortaleciendo 
# la seguridad y la encapsulación de la red.
resource "azurerm_subnet" "postgres" {
  name                 = "postgres-sn"
  resource_group_name  = azurerm_resource_group.agape.name
  virtual_network_name = azurerm_virtual_network.agape.name
  address_prefixes     = ["10.0.0.0/17"] # Es demasiado grande... pendiente validar esto
  service_endpoints    = ["Microsoft.Storage"]
  delegation {
    name = "fs"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# Crea una zona DNS privada para resolver los nombres de dominio dentro de la red virtual, específicamente diseñada 
# para el servidor PostgreSQL.
resource "azurerm_private_dns_zone" "agape" {
  name                = "agape.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.agape.name

}

# Conecta la zona DNS privada con la red virtual, asegurando que las resoluciones de nombres dentro de la red se hagan 
# correctamente.

# La utilización de una zona DNS privada (azurerm_private_dns_zone) y su vinculación con la red virtual (azurerm_private_dns_zone_virtual_network_link) 
# garantiza que cualquier resolución de nombre para el servidor se maneje internamente dentro de la red virtual. 
# Esto impide que las resoluciones de nombres del servidor sean accesibles o interpretables desde fuera de la red virtual.
resource "azurerm_private_dns_zone_virtual_network_link" "agape" {
  name                  = "agapeVnetZone.com"
  private_dns_zone_name = azurerm_private_dns_zone.agape.name
  virtual_network_id    = azurerm_virtual_network.agape.id
  resource_group_name   = azurerm_resource_group.agape.name
  depends_on            = [azurerm_subnet.postgres]
}

# Despliega un servidor PostgreSQL flexible en la subred designada, utilizando la zona DNS privada para la resolución de nombres. 
# El servidor está configurado con varias opciones, incluyendo el tamaño y tipo de almacenamiento, la versión de PostgreSQL, 
# y las credenciales de administrador.

# En la configuración de azurerm_postgresql_flexible_server, el acceso público no se habilita explícitamente, lo cual implica que 
# por defecto está deshabilitado. Además, dado que está asociado con una subred específica que también tiene una configuración de 
# delegación para servidores PostgreSQL, el servidor solo es accesible dentro de esa red virtual.
resource "azurerm_postgresql_flexible_server" "agape" {
  name                   = "agape-psqlflexibleserver"
  resource_group_name    = azurerm_resource_group.agape.name
  location               = azurerm_resource_group.agape.location
  version                = "12"
  delegated_subnet_id    = azurerm_subnet.postgres.id
  private_dns_zone_id    = azurerm_private_dns_zone.agape.id
  administrator_login    = "psqladmin"
  administrator_password = "H@Sh1CoR3!"
  zone                   = "1"

  storage_mb   = 32768
  storage_tier = "P30"

  sku_name   = "GP_Standard_D4s_v3"
  depends_on = [azurerm_private_dns_zone_virtual_network_link.agape]
}

resource "azurerm_postgresql_flexible_server_database" "agape" {
  name      = "agapedb"
  server_id = azurerm_postgresql_flexible_server.agape.id
  collation = "en_US.utf8"
  charset   = "utf8"

  # prevent the possibility of accidental data loss
  # lifecycle {
  #   prevent_destroy = true
  # }
}

output "postgres_connection_uri" {
  value     = "postgresql://${azurerm_postgresql_flexible_server.agape.administrator_login}:${azurerm_postgresql_flexible_server.agape.administrator_password}@${azurerm_postgresql_flexible_server.agape.fqdn}/${azurerm_postgresql_flexible_server_database.agape.name}?sslmode=require"
  sensitive = true
}

#
# Servicio de Almacenamiento
#
resource "random_string" "random" {
  length  = 24
  special = false
  upper   = false
  lower   = true
}

resource "azurerm_storage_account" "agape" {
  name                     = random_string.random.result
  resource_group_name      = azurerm_resource_group.agape.name
  location                 = azurerm_resource_group.agape.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

output "storage_uri" {
  sensitive = true
  value     = azurerm_storage_account.agape.primary_blob_connection_string
}

#
# Kubernetes - Cluster
#
resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.agape.name
  virtual_network_name = azurerm_virtual_network.agape.name

  # Evitando solapamientos con la subred de PostgreSQL
  address_prefixes = ["10.0.128.0/18"]
}


# # https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/kubernetes_cluster
resource "azurerm_kubernetes_cluster" "agape" {
  name                              = "agape-aks"
  location                          = azurerm_resource_group.agape.location
  resource_group_name               = azurerm_resource_group.agape.name
  dns_prefix                        = "agape-k8s"
  role_based_access_control_enabled = true

  default_node_pool {
    name           = "agentpool"
    node_count     = 1
    vm_size        = "Standard_D2_v2"
    vnet_subnet_id = azurerm_subnet.aks.id
  }

  network_profile {
    network_plugin = "azure"
    service_cidr   = "10.0.192.0/18" # Configurado para no solaparse con las subredes
    dns_service_ip = "10.0.192.10"
  }

  linux_profile {
    admin_username = "ubuntu"

    ssh_key {
      key_data = file("~/.ssh/id_rsa.pub")
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = "Demo"
  }
}

resource "null_resource" "apply_k8s_manifest" {
  depends_on = [
    azurerm_kubernetes_cluster.agape,
  ]

  provisioner "local-exec" {
    when       = create
    on_failure = continue

    command = "cd ${path.module} && bash k8s.sh"

    environment = {
      KUBECONFIG_CONTENTS = azurerm_kubernetes_cluster.agape.kube_config_raw
      POSTGRES_URI = "postgresql://${azurerm_postgresql_flexible_server.agape.administrator_login}:${azurerm_postgresql_flexible_server.agape.administrator_password}@${azurerm_postgresql_flexible_server.agape.fqdn}/${azurerm_postgresql_flexible_server_database.agape.name}?sslmode=require"
      STORAGE_URI = azurerm_storage_account.agape.primary_blob_connection_string
    }
  }
}
