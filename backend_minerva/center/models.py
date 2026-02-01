from django.db import models
from django.core.exceptions import ValidationError
from accounts.models import User
from .utils.validators import validate_registry_field



class ManagementCenter(models.Model):
    name = models.CharField(max_length=100, unique=True, validators=[validate_registry_field], verbose_name='Nome')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, related_name='management_centers_created', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Criado por')
    updated_by = models.ForeignKey(User, related_name='management_centers_updated', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Atualizado por')

    def clean(self):
        """Custom validation with Zod-like behavior"""
        errors = {}
        
        if self.name:
            try:
                # Valida and clean the name
                cleaned_name = validate_registry_field(self.name)
                self.name = cleaned_name
                
                # Verifica for duplicates (excluding current instance)
                existing = ManagementCenter.objects.filter(name=cleaned_name)
                if self.pk:
                    existing = existing.exclude(pk=self.pk)
                    
                if existing.exists():
                    errors['name'] = {
                        'field': 'name',
                        'code': 'duplicate',
                        'message': 'Já existe um centro gestor com este registro.'
                    }
            except ValidationError as e:
                errors['name'] = e.message_dict if hasattr(e, 'message_dict') else {'message': str(e)}
        
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
    class Meta:        
        verbose_name = 'Centro Gestor'
        verbose_name_plural = 'Centros Gestores'
        ordering = ['name']
    


class RequestingCenter(models.Model):
    management_center = models.ForeignKey(ManagementCenter, on_delete=models.CASCADE, related_name='requesting_centers', verbose_name='Centro Gestor')
    name = models.CharField(max_length=100, validators=[validate_registry_field], verbose_name='Nome')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, related_name='requesting_centers_created', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Criado por')
    updated_by = models.ForeignKey(User, related_name='requesting_centers_updated', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Atualizado por')

    def clean(self):
        """Custom validation with Zod-like behavior"""
        errors = {}
        
        if self.name:
            try:
                # Valida and clean the name
                cleaned_name = validate_registry_field(self.name)
                self.name = cleaned_name
                
                # Verifica for duplicates within the same management center
                if self.management_center:
                    existing = RequestingCenter.objects.filter(
                        management_center=self.management_center,
                        name=cleaned_name
                    )
                    if self.pk:
                        existing = existing.exclude(pk=self.pk)
                        
                    if existing.exists():
                        errors['name'] = {
                            'field': 'name',
                            'code': 'duplicate',
                            'message': 'Já existe um centro solicitante com este registro no centro gestor selecionado.'
                        }
            except ValidationError as e:
                errors['name'] = e.message_dict if hasattr(e, 'message_dict') else {'message': str(e)}
        
        if not self.management_center:
            errors['management_center'] = {
                'field': 'management_center',
                'code': 'required',
                'message': 'O centro gestor é obrigatório.'
            }
        
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Centro Solicitante'
        verbose_name_plural = 'Centros Solicitantes'
        unique_together = ('management_center', 'name')
        ordering = ['name']



class CenterHierarchy(models.Model):
    """
    Modelo para associar centros de custo com hierarquia organizacional
    Permite implementar permissões baseadas na estrutura organizacional
    """
    management_center = models.ForeignKey(
        ManagementCenter, 
        on_delete=models.CASCADE, 
        related_name='hierarchy_associations',
        verbose_name='Centro Gestor'
    )
    
    direction = models.ForeignKey(
        'sector.Direction', 
        on_delete=models.CASCADE, 
        null=True, blank=True,
        verbose_name='Direção'
    )
    
    management = models.ForeignKey(
        'sector.Management', 
        on_delete=models.CASCADE, 
        null=True, blank=True,
        verbose_name='Gerência'
    )
    
    coordination = models.ForeignKey(
        'sector.Coordination', 
        on_delete=models.CASCADE, 
        null=True, blank=True,
        verbose_name='Coordenação'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(
        User, 
        related_name='center_hierarchies_created', 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        verbose_name='Criado por'
    )

    def clean(self):
        """Validação para garantir hierarquia consistente"""
        errors = {}
        
        # Se tem coordenação, deve ter gerência
        if self.coordination and not self.management:
            errors['management'] = 'Coordenação requer uma Gerência associada.'
            
        # Se tem gerência, deve ter direção
        if self.management and not self.direction:
            errors['direction'] = 'Gerência requer uma Direção associada.'
            
        # Se tem coordenação, ela deve pertencer à gerência especificada
        if self.coordination and self.management:
            if self.coordination.management != self.management:
                errors['coordination'] = 'Coordenação deve pertencer à Gerência especificada.'
                
        # Se tem gerência, ela deve pertencer à direção especificada  
        if self.management and self.direction:
            if self.management.direction != self.direction:
                errors['management'] = 'Gerência deve pertencer à Direção especificada.'
        
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        parts = [str(self.management_center)]
        if self.direction:
            parts.append(f"Dir: {self.direction.name}")
        if self.management:
            parts.append(f"Ger: {self.management.name}")
        if self.coordination:
            parts.append(f"Coord: {self.coordination.name}")
        return " → ".join(parts)

    @property
    def hierarchy_level(self):
        """Retorna o nível hierárquico mais específico"""
        if self.coordination:
            return 'coordination'
        elif self.management:
            return 'management'
        elif self.direction:
            return 'direction'
        return 'management_center'

    class Meta:
        verbose_name = 'Associação Centro-Hierarquia'
        verbose_name_plural = 'Associações Centro-Hierarquia'
        unique_together = [
            ('management_center', 'direction', 'management', 'coordination')
        ]
        indexes = [
            models.Index(fields=['direction']),
            models.Index(fields=['management']), 
            models.Index(fields=['coordination']),
            models.Index(fields=['management_center']),
        ]