# # https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/kubernetes_cluster
# resource "azurerm_kubernetes_cluster" "agape" {
#   name                              = "agape-aks"
#   location                          = azurerm_resource_group.agape.location
#   resource_group_name               = azurerm_resource_group.agape.name
#   dns_prefix                        = "agape-k8s"
#   role_based_access_control_enabled = true

#   default_node_pool {
#     name           = "agentpool"
#     node_count     = 1
#     vm_size        = "Standard_D2_v2"
#     vnet_subnet_id = azurerm_subnet.agape.id
#   }

#   linux_profile {
#     admin_username = "ubuntu"

#     ssh_key {
#       key_data = file("C:\\Users\\win\\.ssh\\id_rsa.pub")
#     }
#   }

#   identity {
#     type = "SystemAssigned"
#   }

#   tags = {
#     environment = "Demo"
#   }
# }

# # # Crear la cuenta de almacenamiento
# resource "azurerm_storage_account" "agape" {
#   name                     = random_string.random.result
#   resource_group_name      = azurerm_resource_group.agape.name
#   location                 = azurerm_resource_group.agape.location
#   account_tier             = "Standard"
#   account_replication_type = "LRS"
# }

# output "storage_uri" {
#   sensitive = true
#   value     = azurerm_storage_account.agape.primary_blob_connection_string
# }


# resource "null_resource" "apply_k8s_manifest" {
#   depends_on = [
#     azurerm_kubernetes_cluster.agape,
#   ]

#   provisioner "local-exec" {
#     when       = create
#     on_failure = continue

#     command = "PowerShell -NoProfile -ExecutionPolicy Bypass -File C:\\Users\\win\\github.com\\agape-app-react\\.deploy\\k8s\\apply.ps1"

#     environment = {
#       KUBECONFIG_CONTENTS = azurerm_kubernetes_cluster.agape.kube_config_raw
#     }
#   }
# }